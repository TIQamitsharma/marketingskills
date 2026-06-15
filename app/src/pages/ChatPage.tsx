import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  Send, Plus, ChevronDown, BookOpen, FolderOpen,
  CircleAlert as AlertCircle, MessageSquare, Trash2, Loader, Bot
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  sendMessage, type Message, type AIProvider, type AIConfig,
  AI_PROVIDER_LABELS, INTEGRATION_TO_PROVIDER
} from '../lib/claude'
import { SKILLS, type Skill } from '../data/skills'
import { AI_PROVIDER_IDS } from '../data/integrations'
import MarkdownRenderer from '../components/MarkdownRenderer'

interface Conversation {
  id: string
  title: string
  skill_used: string | null
  created_at: string
}

interface Project {
  id: string
  name: string
  product_context: string | null
}

interface ConfiguredAI {
  integrationId: string
  provider: AIProvider
  apiKey: string
}

export default function ChatPage() {
  const { user } = useAuth()
  const { id: convId } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(convId ?? null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [configuredAIs, setConfiguredAIs] = useState<ConfiguredAI[]>([])
  const [selectedAIIndex, setSelectedAIIndex] = useState(0)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(searchParams.get('project'))
  const [selectedSkill, setSelectedSkill] = useState<string | null>(searchParams.get('skill'))
  const [showSkillPicker, setShowSkillPicker] = useState(false)
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const [showProviderPicker, setShowProviderPicker] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [skillQuery, setSkillQuery] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeSkill = selectedSkill ? SKILLS.find(s => s.id === selectedSkill) : null
  const activeProject = selectedProject ? projects.find(p => p.id === selectedProject) : null
  const activeAI = configuredAIs[selectedAIIndex] ?? null

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    fetchSidebarData()
  }, [user])

  useEffect(() => {
    if (activeConvId) loadConversation(activeConvId)
  }, [activeConvId])

  const fetchSidebarData = async () => {
    const [convRes, integRes, projRes] = await Promise.all([
      supabase.from('conversations').select('id, title, skill_used, created_at').order('created_at', { ascending: false }).limit(30),
      supabase.from('user_integrations').select('integration_key, api_key').in('integration_key', AI_PROVIDER_IDS).eq('is_configured', true),
      supabase.from('projects').select('id, name, product_context').order('created_at', { ascending: false }),
    ])

    setConversations(convRes.data ?? [])
    setProjects(projRes.data ?? [])

    const ais: ConfiguredAI[] = (integRes.data ?? [])
      .filter(r => r.api_key)
      .map(r => ({
        integrationId: r.integration_key,
        provider: INTEGRATION_TO_PROVIDER[r.integration_key] ?? 'anthropic',
        apiKey: r.api_key!,
      }))
    setConfiguredAIs(ais)
  }

  const loadConversation = async (id: string) => {
    const { data } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
    setMessages((data ?? []) as Message[])
    const conv = conversations.find(c => c.id === id)
    if (conv?.skill_used) setSelectedSkill(conv.skill_used)
  }

  const createConversation = async (firstMessage: string, skillId: string | null): Promise<string> => {
    const title = firstMessage.length > 60 ? firstMessage.slice(0, 60) + '...' : firstMessage
    const { data } = await supabase
      .from('conversations')
      .insert({ user_id: user!.id, title, skill_used: skillId, project_id: selectedProject ?? null })
      .select()
      .single()
    const newConv = data!
    setConversations(prev => [newConv, ...prev])
    return newConv.id
  }

  const saveMessage = async (convId: string, role: 'user' | 'assistant', content: string) => {
    await supabase.from('messages').insert({ conversation_id: convId, role, content })
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return

    if (!activeAI) {
      setError('No AI provider configured. Go to Integrations to add an API key.')
      return
    }

    setError('')
    setInput('')
    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setSending(true)

    let currentConvId = activeConvId

    try {
      if (!currentConvId) {
        currentConvId = await createConversation(text, selectedSkill)
        setActiveConvId(currentConvId)
      }

      await saveMessage(currentConvId, 'user', text)

      const config: AIConfig = { provider: activeAI.provider, apiKey: activeAI.apiKey }
      const productContext = activeProject?.product_context ?? null
      const reply = await sendMessage(newMessages, config, selectedSkill, productContext)

      const assistantMsg: Message = { role: 'assistant', content: reply }
      setMessages(prev => [...prev, assistantMsg])
      await saveMessage(currentConvId, 'assistant', reply)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('conversations').delete().eq('id', id)
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeConvId === id) {
      setActiveConvId(null)
      setMessages([])
    }
  }

  const startNew = () => {
    setActiveConvId(null)
    setMessages([])
    setError('')
    setSelectedSkill(null)
  }

  const closeAllPickers = () => {
    setShowSkillPicker(false)
    setShowProjectPicker(false)
    setShowProviderPicker(false)
  }

  const filteredSkills = SKILLS.filter(s =>
    skillQuery === '' ||
    s.name.toLowerCase().includes(skillQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(skillQuery.toLowerCase())
  )

  return (
    <div className="chat-layout">
      <aside className={`chat-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="chat-sidebar-header">
          <button className="btn btn-primary btn-sm full-width" onClick={startNew}>
            <Plus size={14} /> New Chat
          </button>
          <button className="icon-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">
            <ChevronDown size={16} className={sidebarOpen ? 'rotate-left' : 'rotate-right'} />
          </button>
        </div>

        {conversations.length === 0 ? (
          <div className="chat-sidebar-empty">
            <MessageSquare size={24} />
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="conv-list">
            {conversations.map(conv => {
              const skill = SKILLS.find(s => s.id === conv.skill_used)
              return (
                <div
                  key={conv.id}
                  className={`conv-item ${activeConvId === conv.id ? 'active' : ''}`}
                  onClick={() => { setActiveConvId(conv.id); loadConversation(conv.id) }}
                >
                  <span className="conv-icon">{skill?.icon ?? '💬'}</span>
                  <div className="conv-body">
                    <div className="conv-title">{conv.title}</div>
                    <div className="conv-meta">{new Date(conv.created_at).toLocaleDateString()}</div>
                  </div>
                  <button className="conv-delete" onClick={e => deleteConversation(conv.id, e)} title="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </aside>

      <div className="chat-main">
        <div className="chat-toolbar">
          <div className="chat-toolbar-left">

            {/* AI Provider picker */}
            <div className="skill-selector-wrap">
              <button
                className={`skill-selector-btn ${activeAI ? 'has-skill' : ''}`}
                onClick={() => { setShowProviderPicker(!showProviderPicker); setShowSkillPicker(false); setShowProjectPicker(false) }}
              >
                <Bot size={14} />
                <span>{activeAI ? AI_PROVIDER_LABELS[activeAI.provider] : 'No AI key'}</span>
                <ChevronDown size={12} />
              </button>

              {showProviderPicker && (
                <div className="skill-picker-dropdown">
                  <div className="skill-picker-list">
                    {configuredAIs.length === 0 ? (
                      <div className="picker-empty">
                        <Link to="/integrations" onClick={closeAllPickers}>
                          Add an AI key in Integrations →
                        </Link>
                      </div>
                    ) : (
                      configuredAIs.map((ai, idx) => (
                        <button
                          key={ai.integrationId}
                          className={`skill-picker-item ${selectedAIIndex === idx ? 'active' : ''}`}
                          onClick={() => { setSelectedAIIndex(idx); setShowProviderPicker(false) }}
                        >
                          <Bot size={14} />
                          <div>
                            <div className="skill-picker-name">{AI_PROVIDER_LABELS[ai.provider]}</div>
                            <div className="skill-picker-cat">Connected</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Skill picker */}
            <div className="skill-selector-wrap">
              <button
                className={`skill-selector-btn ${activeSkill ? 'has-skill' : ''}`}
                onClick={() => { setShowSkillPicker(!showSkillPicker); setShowProjectPicker(false); setShowProviderPicker(false) }}
              >
                <BookOpen size={14} />
                {activeSkill ? (
                  <span>{activeSkill.icon} {activeSkill.name}</span>
                ) : (
                  <span>Select a skill</span>
                )}
                <ChevronDown size={12} />
              </button>

              {showSkillPicker && (
                <div className="skill-picker-dropdown">
                  <div className="skill-picker-search">
                    <input
                      placeholder="Search skills..."
                      value={skillQuery}
                      onChange={e => setSkillQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="skill-picker-list">
                    <button
                      className="skill-picker-item"
                      onClick={() => { setSelectedSkill(null); setShowSkillPicker(false) }}
                    >
                      <span>No skill (general)</span>
                    </button>
                    {filteredSkills.map(skill => (
                      <button
                        key={skill.id}
                        className={`skill-picker-item ${selectedSkill === skill.id ? 'active' : ''}`}
                        onClick={() => { setSelectedSkill(skill.id); setShowSkillPicker(false); setSkillQuery('') }}
                      >
                        <span className="skill-picker-icon">{skill.icon}</span>
                        <div>
                          <div className="skill-picker-name">{skill.name}</div>
                          <div className="skill-picker-cat">{skill.category}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Project picker */}
            <div className="project-selector-wrap">
              <button
                className={`skill-selector-btn ${activeProject ? 'has-skill' : ''}`}
                onClick={() => { setShowProjectPicker(!showProjectPicker); setShowSkillPicker(false); setShowProviderPicker(false) }}
              >
                <FolderOpen size={14} />
                {activeProject ? activeProject.name : 'No project'}
                <ChevronDown size={12} />
              </button>

              {showProjectPicker && (
                <div className="skill-picker-dropdown">
                  <div className="skill-picker-list">
                    <button
                      className="skill-picker-item"
                      onClick={() => { setSelectedProject(null); setShowProjectPicker(false) }}
                    >
                      No project
                    </button>
                    {projects.map(p => (
                      <button
                        key={p.id}
                        className={`skill-picker-item ${selectedProject === p.id ? 'active' : ''}`}
                        onClick={() => { setSelectedProject(p.id); setShowProjectPicker(false) }}
                      >
                        <FolderOpen size={14} />
                        <div>
                          <div className="skill-picker-name">{p.name}</div>
                          <div className="skill-picker-cat">{p.product_context ? 'Has context' : 'No context'}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {!activeAI && (
            <Link to="/integrations" className="no-key-warning">
              <AlertCircle size={14} />
              Add AI API key
            </Link>
          )}
        </div>

        <div className="chat-messages" onClick={closeAllPickers}>
          {messages.length === 0 ? (
            <ChatWelcome
              skill={activeSkill ?? null}
              project={activeProject ?? null}
              hasKey={!!activeAI}
              onSkillSelect={setSelectedSkill}
            />
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`msg msg-${msg.role}`}>
                  <div className="msg-avatar">
                    {msg.role === 'user' ? '👤' : '✦'}
                  </div>
                  <div className="msg-content">
                    {msg.role === 'assistant' ? (
                      <MarkdownRenderer content={msg.content} />
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="msg msg-assistant">
                  <div className="msg-avatar">✦</div>
                  <div className="msg-content typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="chat-error">
            <AlertCircle size={16} />
            {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        <div className="chat-input-area">
          <div className="chat-input-wrap">
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder={activeSkill ? `Ask about ${activeSkill.name}...` : 'Ask anything about your marketing...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || sending}
            >
              {sending ? <Loader size={16} className="spin" /> : <Send size={16} />}
            </button>
          </div>
          <div className="chat-input-hint">
            Press Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatWelcome({
  skill, project, hasKey, onSkillSelect
}: {
  skill: Skill | null
  project: Project | null
  hasKey: boolean
  onSkillSelect: (id: string) => void
}) {
  const suggested = SKILLS.filter(s => s.category !== 'Foundation').slice(0, 6)

  return (
    <div className="chat-welcome">
      <div className="welcome-icon">✦</div>
      <h2 className="welcome-title">
        {skill ? `${skill.icon} ${skill.name}` : 'Marketing AI Assistant'}
      </h2>
      <p className="welcome-sub">
        {skill
          ? skill.description
          : 'Select a skill or start chatting for expert marketing guidance.'
        }
      </p>

      {project && (
        <div className="welcome-context-badge">
          <FolderOpen size={14} />
          {project.name} context {project.product_context ? 'loaded' : 'not set'}
        </div>
      )}

      {!hasKey && (
        <div className="welcome-warning">
          <AlertCircle size={15} />
          <span>No AI key found. <Link to="/integrations">Add an API key</Link> to start chatting.</span>
        </div>
      )}

      {!skill && (
        <div className="welcome-suggestions">
          <div className="welcome-suggestions-label">Popular skills</div>
          <div className="welcome-suggestions-grid">
            {suggested.map(s => (
              <button
                key={s.id}
                className="suggestion-chip"
                onClick={() => onSkillSelect(s.id)}
              >
                {s.icon} {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
