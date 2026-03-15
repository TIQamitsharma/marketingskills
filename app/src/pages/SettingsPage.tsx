import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Save, User } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setFullName(user?.user_metadata?.full_name ?? '')
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    await supabase.auth.updateUser({ data: { full_name: fullName } })
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', user!.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Manage your account preferences</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card">
          <div className="card-header">
            <User size={18} />
            <h2>Profile</h2>
          </div>

          <div className="form-group">
            <label>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="input-disabled"
            />
            <div className="form-hint">Email cannot be changed</div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={15} />
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Account info</h2>
          </div>
          <div className="info-rows">
            <div className="info-row">
              <span className="info-label">Account ID</span>
              <span className="info-value mono">{user?.id?.slice(0, 8)}...</span>
            </div>
            <div className="info-row">
              <span className="info-label">Member since</span>
              <span className="info-value">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Email verified</span>
              <span className="info-value">
                {user?.email_confirmed_at ? '✓ Yes' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
