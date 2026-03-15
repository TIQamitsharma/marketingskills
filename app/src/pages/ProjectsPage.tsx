import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FolderOpen, ArrowRight, CreditCard as Edit2, Trash2, X, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Project {
  id: string
  name: string
  description: string | null
  product_context: string | null
  created_at: string
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [user])

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    setProjects(data ?? [])
    setLoading(false)
  }

  const createProject = async () => {
    if (!newName.trim()) return
    setCreating(true)
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user!.id, name: newName.trim(), description: newDesc.trim() || null })
      .select()
      .single()

    if (!error && data) {
      setProjects(prev => [data, ...prev])
      setShowNew(false)
      setNewName('')
      setNewDesc('')
    }
    setCreating(false)
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return
    await supabase.from('projects').update({ name: editName.trim() }).eq('id', id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: editName.trim() } : p))
    setEditingId(null)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">Organize conversations and context by product or brand</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {showNew && (
        <div className="new-project-card">
          <h3>New Project</h3>
          <div className="form-group">
            <label>Project name</label>
            <input
              type="text"
              placeholder="e.g. Acme SaaS, Marketing Overhaul"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && createProject()}
            />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <input
              type="text"
              placeholder="Brief description of this project"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={createProject} disabled={creating || !newName.trim()}>
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="skeleton-list">
          {[1, 2, 3].map(i => <div className="skeleton-item tall" key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state large">
          <FolderOpen size={48} />
          <h3>No projects yet</h3>
          <p>Create a project to organize your marketing work and save product context.</p>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={16} /> Create your first project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div className="project-card" key={project.id}>
              <div className="project-card-header">
                <div className="project-icon">
                  <FolderOpen size={18} />
                </div>

                {editingId === project.id ? (
                  <div className="project-edit-row">
                    <input
                      className="project-edit-input"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(project.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                    />
                    <button className="icon-btn" onClick={() => saveEdit(project.id)}>
                      <Check size={14} />
                    </button>
                    <button className="icon-btn" onClick={() => setEditingId(null)}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <h3 className="project-name">{project.name}</h3>
                )}

                <div className="project-actions">
                  <button
                    className="icon-btn"
                    onClick={() => { setEditingId(project.id); setEditName(project.name) }}
                    title="Rename"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="icon-btn icon-btn-danger"
                    onClick={() => deleteProject(project.id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {project.description && (
                <p className="project-desc">{project.description}</p>
              )}

              <div className="project-meta">
                <span className={`context-badge ${project.product_context ? 'has-context' : ''}`}>
                  {project.product_context ? '✓ Context saved' : 'No context yet'}
                </span>
                <span className="project-date">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="project-footer">
                <Link
                  to={`/chat?project=${project.id}`}
                  className="btn btn-secondary btn-sm"
                >
                  Open in Chat <ArrowRight size={14} />
                </Link>
                <Link
                  to={`/projects/${project.id}`}
                  className="btn btn-ghost btn-sm"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
