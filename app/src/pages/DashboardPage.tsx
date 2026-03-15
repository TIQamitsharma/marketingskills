import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { MessageSquare, FolderOpen, Puzzle, BookOpen, ArrowRight, TrendingUp, Clock } from 'lucide-react'
import { SKILLS } from '../data/skills'

interface Stats {
  conversations: number
  projects: number
  integrations: number
}

interface RecentConversation {
  id: string
  title: string
  skill_used: string | null
  created_at: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ conversations: 0, projects: 0, integrations: 0 })
  const [recent, setRecent] = useState<RecentConversation[]>([])
  const [loading, setLoading] = useState(true)

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    async function fetchData() {
      const [convRes, projRes, intRes, recentRes] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('user_integrations').select('id', { count: 'exact', head: true }).eq('is_configured', true),
        supabase.from('conversations').select('id, title, skill_used, created_at').order('created_at', { ascending: false }).limit(5),
      ])

      setStats({
        conversations: convRes.count ?? 0,
        projects: projRes.count ?? 0,
        integrations: intRes.count ?? 0,
      })
      setRecent(recentRes.data ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const STAT_CARDS = [
    { label: 'Conversations', value: stats.conversations, icon: <MessageSquare size={20} />, to: '/chat', color: 'blue' },
    { label: 'Projects', value: stats.projects, icon: <FolderOpen size={20} />, to: '/projects', color: 'green' },
    { label: 'Active Integrations', value: stats.integrations, icon: <Puzzle size={20} />, to: '/integrations', color: 'amber' },
    { label: 'Available Skills', value: SKILLS.length, icon: <BookOpen size={20} />, to: '/skills', color: 'rose' },
  ]

  const QUICK_ACTIONS = [
    { label: 'Optimize a landing page', skill: 'page-cro', desc: 'CRO analysis & recommendations' },
    { label: 'Write marketing copy', skill: 'copywriting', desc: 'Headlines, CTAs, and page copy' },
    { label: 'Set up product context', skill: 'product-marketing-context', desc: 'Foundation for all skills' },
    { label: 'Plan an A/B test', skill: 'ab-test-setup', desc: 'Hypothesis and test design' },
    { label: 'Review SEO', skill: 'seo-audit', desc: 'Technical & on-page audit' },
    { label: 'Build email sequence', skill: 'email-sequence', desc: 'Drip campaigns & automations' },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {firstName}</h1>
          <p className="page-sub">Your AI marketing workspace is ready.</p>
        </div>
        <Link to="/chat" className="btn btn-primary">
          New Conversation <ArrowRight size={16} />
        </Link>
      </div>

      <div className="stats-grid">
        {STAT_CARDS.map(card => (
          <Link to={card.to} className={`stat-card stat-card-${card.color}`} key={card.label}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-body">
              <div className="stat-value">{loading ? '—' : card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
            <ArrowRight size={14} className="stat-arrow" />
          </Link>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <TrendingUp size={16} />
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            {QUICK_ACTIONS.map(action => (
              <Link
                key={action.skill}
                to={`/chat?skill=${action.skill}`}
                className="quick-action-card"
              >
                <div className="quick-action-label">{action.label}</div>
                <div className="quick-action-desc">{action.desc}</div>
                <ArrowRight size={14} className="quick-action-arrow" />
              </Link>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <Clock size={16} />
            <h2>Recent Conversations</h2>
            <Link to="/chat" className="section-link">View all</Link>
          </div>

          {loading ? (
            <div className="skeleton-list">
              {[1, 2, 3].map(i => <div className="skeleton-item" key={i} />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={32} />
              <p>No conversations yet</p>
              <Link to="/chat" className="btn btn-secondary btn-sm">Start your first</Link>
            </div>
          ) : (
            <div className="recent-list">
              {recent.map(conv => {
                const skill = SKILLS.find(s => s.id === conv.skill_used)
                return (
                  <Link to={`/chat/${conv.id}`} className="recent-item" key={conv.id}>
                    <div className="recent-icon">{skill?.icon ?? '💬'}</div>
                    <div className="recent-body">
                      <div className="recent-title">{conv.title}</div>
                      <div className="recent-meta">
                        {skill ? skill.name : 'General'} · {new Date(conv.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <ArrowRight size={14} className="recent-arrow" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
