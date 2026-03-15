import { useEffect, useState } from 'react'
import { Search, Check, Key, ExternalLink, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { INTEGRATIONS, INTEGRATION_CATEGORIES, type Integration } from '../data/integrations'

interface ConfiguredMap {
  [key: string]: { api_key: string; is_configured: boolean }
}

export default function IntegrationsPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [configured, setConfigured] = useState<ConfiguredMap>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<string | null>(null)

  const categories = ['All', ...INTEGRATION_CATEGORIES]

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_integrations')
      .select('integration_key, api_key, is_configured')
      .then(({ data }) => {
        const map: ConfiguredMap = {}
        for (const row of data ?? []) {
          map[row.integration_key] = {
            api_key: row.api_key ?? '',
            is_configured: row.is_configured,
          }
        }
        setConfigured(map)
      })
  }, [user])

  const handleSave = async (integration: Integration) => {
    const key = editValues[integration.id] ?? ''
    if (!key.trim()) return
    setSaving(integration.id)

    const { error } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: user!.id,
        integration_key: integration.id,
        api_key: key.trim(),
        is_configured: true,
      }, { onConflict: 'user_id,integration_key' })

    if (!error) {
      setConfigured(prev => ({
        ...prev,
        [integration.id]: { api_key: key.trim(), is_configured: true },
      }))
      setSaved(integration.id)
      setTimeout(() => setSaved(null), 2000)
    }
    setSaving(null)
  }

  const handleRemove = async (integrationId: string) => {
    await supabase
      .from('user_integrations')
      .update({ api_key: null, is_configured: false })
      .eq('user_id', user!.id)
      .eq('integration_key', integrationId)

    setConfigured(prev => ({
      ...prev,
      [integrationId]: { api_key: '', is_configured: false },
    }))
  }

  const filtered = INTEGRATIONS.filter(i => {
    const matchesQuery =
      query === '' ||
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      i.description.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = activeCategory === 'All' || i.category === activeCategory
    return matchesQuery && matchesCategory
  })

  const grouped = categories
    .filter(c => c !== 'All')
    .map(cat => ({ cat, items: filtered.filter(i => i.category === cat) }))
    .filter(g => g.items.length > 0)

  const configuredCount = Object.values(configured).filter(v => v.is_configured).length

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Integrations</h1>
          <p className="page-sub">{configuredCount} of {INTEGRATIONS.length} connected</p>
        </div>
      </div>

      <div className="skills-toolbar">
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search integrations..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="integrations-list">
        {(activeCategory === 'All' ? grouped : [{ cat: activeCategory, items: filtered }]).map(({ cat, items }) => (
          items.length > 0 && (
            <div key={cat} className="integration-group">
              {activeCategory === 'All' && <h2 className="skill-group-title">{cat}</h2>}
              {items.map(integration => {
                const isConfigured = configured[integration.id]?.is_configured
                const isExpanded = expanded === integration.id

                return (
                  <div
                    key={integration.id}
                    className={`integration-card ${isConfigured ? 'configured' : ''} ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div
                      className="integration-header"
                      onClick={() => setExpanded(isExpanded ? null : integration.id)}
                    >
                      <div className="integration-left">
                        <div className={`integration-dot ${isConfigured ? 'configured' : ''}`} />
                        <div>
                          <div className="integration-name">{integration.name}</div>
                          <div className="integration-category-badge">{integration.category}</div>
                        </div>
                      </div>
                      <div className="integration-right">
                        {isConfigured && (
                          <span className="integration-status">
                            <Check size={12} /> Connected
                          </span>
                        )}
                        <ChevronDown
                          size={16}
                          className={`integration-chevron ${isExpanded ? 'rotate' : ''}`}
                        />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="integration-body">
                        <p className="integration-desc">{integration.description}</p>

                        <div className="form-group">
                          <div className="integration-label-row">
                            <label>{integration.apiKeyLabel}</label>
                            <a
                              href={integration.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="integration-docs-link"
                            >
                              Get key <ExternalLink size={12} />
                            </a>
                          </div>
                          <div className="input-wrap">
                            <Key size={14} className="input-icon" />
                            <input
                              type="password"
                              placeholder={isConfigured ? 'Re-enter to update' : integration.apiKeyPlaceholder}
                              value={editValues[integration.id] ?? ''}
                              onChange={e => setEditValues(prev => ({
                                ...prev,
                                [integration.id]: e.target.value
                              }))}
                            />
                          </div>
                        </div>

                        <div className="integration-actions">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSave(integration)}
                            disabled={saving === integration.id || !editValues[integration.id]?.trim()}
                          >
                            {saving === integration.id ? 'Saving...' :
                             saved === integration.id ? '✓ Saved' : 'Save Key'}
                          </button>
                          {isConfigured && (
                            <button
                              className="btn btn-ghost btn-sm text-red"
                              onClick={() => handleRemove(integration.id)}
                            >
                              Disconnect
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        ))}
      </div>
    </div>
  )
}
