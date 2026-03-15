import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Zap, LayoutDashboard, MessageSquare, FolderOpen,
  Puzzle, BookOpen, Settings, LogOut, Menu, X, ChevronDown
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { to: '/projects', icon: <FolderOpen size={18} />, label: 'Projects' },
  { to: '/skills', icon: <BookOpen size={18} />, label: 'Skills' },
  { to: '/integrations', icon: <Puzzle size={18} />, label: 'Integrations' },
  { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isChat = location.pathname.startsWith('/chat')

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="app-layout">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Zap size={20} />
          </div>
          <span className="sidebar-brand">MarketingSkills</span>
          <button className="sidebar-close" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-menu-wrap">
            <button className="user-trigger" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="user-avatar">{initials}</div>
              <div className="user-info">
                <span className="user-name">{user?.user_metadata?.full_name || 'Account'}</span>
                <span className="user-email">{user?.email}</span>
              </div>
              <ChevronDown size={14} className={`user-chevron ${userMenuOpen ? 'rotate' : ''}`} />
            </button>

            {userMenuOpen && (
              <div className="user-dropdown">
                <button className="user-dropdown-item" onClick={handleSignOut}>
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-logo">
            <Zap size={18} />
            <span>MarketingSkills</span>
          </div>
        </header>

        <main className={`main-content ${isChat ? 'no-padding' : ''}`}>
          {children}
        </main>
      </div>

      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}
    </div>
  )
}
