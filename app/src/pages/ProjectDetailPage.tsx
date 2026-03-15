import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Project {
  id: string
  name: string
  description: string | null
  product_context: string | null
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [context, setContext] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase.from('projects').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) {
        setProject(data)
        setContext(data.product_context ?? '')
      }
    })
  }, [id])

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    await supabase.from('projects').update({ product_context: context }).eq('id', id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  if (!project) return <div className="page"><div className="loading-spinner" /></div>

  return (
    <div className="page">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/projects" className="breadcrumb-link">
            <ArrowLeft size={16} /> Projects
          </Link>
          <span className="breadcrumb-sep">/</span>
          <span>{project.name}</span>
        </div>
      </div>

      <div className="project-detail-grid">
        <div className="project-detail-main">
          <div className="card">
            <div className="card-header">
              <h2>Product Marketing Context</h2>
              <p className="card-sub">
                This context is automatically referenced by all marketing skills.
                Fill it out using the <strong>product-marketing-context</strong> skill in Chat.
              </p>
            </div>

            <div className="form-group">
              <textarea
                className="context-textarea"
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder={`# Product Marketing Context\n\n## Product Overview\n**One-liner:** \n**What it does:** \n\n## Target Audience\n**Target companies:** \n**Decision-makers:** \n\n## Problems & Pain Points\n...`}
                rows={24}
              />
            </div>

            <div className="card-footer">
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={15} />
                {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Context'}
              </button>
            </div>
          </div>
        </div>

        <div className="project-detail-side">
          <div className="card">
            <h3 className="card-title">Quick actions</h3>
            <div className="side-actions">
              <Link
                to={`/chat?project=${id}&skill=product-marketing-context`}
                className="side-action"
              >
                <MessageSquare size={16} />
                <div>
                  <div className="side-action-label">Build context with AI</div>
                  <div className="side-action-desc">Let Claude draft your context from scratch</div>
                </div>
              </Link>
              <Link
                to={`/chat?project=${id}`}
                className="side-action"
              >
                <MessageSquare size={16} />
                <div>
                  <div className="side-action-label">Start a conversation</div>
                  <div className="side-action-desc">Chat with this project context active</div>
                </div>
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Context tips</h3>
            <ul className="tips-list">
              <li>Include your product's one-liner and what it does</li>
              <li>Describe your target audience and ICP</li>
              <li>List your top 3 competitors and differentiators</li>
              <li>Add customer language verbatim when possible</li>
              <li>Include your main conversion goal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
