import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { SKILLS, SKILL_CATEGORIES } from '../data/skills'
import { INTEGRATIONS, INTEGRATION_CATEGORIES } from '../data/integrations'
import {
  Zap, ArrowRight, FolderOpen, BookOpen, Puzzle,
  Check, Bot, Target, TrendingUp, Shield, ChevronRight, Sparkles
} from 'lucide-react'

const FEATURE_HIGHLIGHTS = [
  {
    icon: <Bot size={22} />,
    title: '4 AI Providers',
    desc: 'Claude, OpenRouter, Gemini, and OpenAI — bring your own key and switch any time.',
  },
  {
    icon: <BookOpen size={22} />,
    title: '33 Marketing Skills',
    desc: 'Specialist prompts for CRO, SEO, copywriting, email, paid ads, and more.',
  },
  {
    icon: <Puzzle size={22} />,
    title: '40+ Integrations',
    desc: 'Connect your analytics, CRM, email, and ad platforms for context-aware output.',
  },
  {
    icon: <FolderOpen size={22} />,
    title: 'Project Context',
    desc: 'Save your product positioning once — every skill references it automatically.',
  },
  {
    icon: <Shield size={22} />,
    title: 'Your Keys, Your Data',
    desc: 'API keys are stored securely in your account. We never have access to them.',
  },
  {
    icon: <Target size={22} />,
    title: 'Grounded in Your Product',
    desc: 'AI output is tailored to your ICP, competitors, and conversion goals.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Add an AI key',
    desc: 'Connect Claude, OpenRouter, Gemini, or OpenAI. Your key stays in your account.',
  },
  {
    step: '02',
    title: 'Set product context',
    desc: 'Describe your product, ICP, and goals once. Every skill uses it automatically.',
  },
  {
    step: '03',
    title: 'Pick a skill and chat',
    desc: 'Choose from 33 specialist skills and get expert marketing output in seconds.',
  },
]

export default function LandingPage() {
  const { user } = useAuth()

  const skillsByCategory = SKILL_CATEGORIES.map(cat => ({
    cat,
    skills: SKILLS.filter(s => s.category === cat),
  })).filter(g => g.skills.length > 0)

  const integrationsByCategory = INTEGRATION_CATEGORIES.map(cat => ({
    cat,
    items: INTEGRATIONS.filter(i => i.category === cat),
  })).filter(g => g.items.length > 0)

  return (
    <div className="landing">
      {/* ── Nav ── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <Zap size={20} />
            <span>MarketingSkills</span>
          </div>
          <div className="landing-nav-actions">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                Go to Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link to="/auth" className="landing-nav-link">Sign in</Link>
                <Link to="/auth" className="btn btn-primary btn-sm">
                  Get started free <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-badge">
            <Sparkles size={13} />
            <span>33 specialist skills · 4 AI providers · 40+ integrations</span>
          </div>
          <h1 className="landing-h1">
            AI marketing expertise,<br />grounded in your product
          </h1>
          <p className="landing-sub">
            MarketingSkills gives every marketer and founder access to specialist AI skills for CRO,
            SEO, copywriting, email, paid ads, and more — personalised to your product and audience.
          </p>
          <div className="landing-cta-row">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Open Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/auth" className="btn btn-primary btn-lg">
                  Get started free <ArrowRight size={16} />
                </Link>
                <Link to="/auth" className="btn btn-ghost btn-lg">
                  Sign in
                </Link>
              </>
            )}
          </div>
          <div className="landing-hero-proof">
            {['No credit card required', 'Bring your own AI key', 'All data stays in your account'].map(t => (
              <div className="hero-proof-item" key={t}>
                <Check size={13} />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-label">How it works</div>
          <h2 className="landing-h2">Up and running in minutes</h2>
          <div className="how-grid">
            {HOW_IT_WORKS.map(item => (
              <div className="how-card" key={item.step}>
                <div className="how-step">{item.step}</div>
                <h3 className="how-title">{item.title}</h3>
                <p className="how-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-section landing-section-alt">
        <div className="landing-container">
          <div className="landing-section-label">Features</div>
          <h2 className="landing-h2">Everything you need to execute faster</h2>
          <div className="features-grid">
            {FEATURE_HIGHLIGHTS.map(f => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Skills showcase ── */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-label">Skills library</div>
          <h2 className="landing-h2">{SKILLS.length} specialist marketing skills</h2>
          <p className="landing-section-sub">
            Each skill is a focused AI expert. Select one before chatting to get output
            tailored to that discipline rather than generic responses.
          </p>
          <div className="skills-showcase">
            {skillsByCategory.map(({ cat, skills }) => (
              <div className="skills-showcase-group" key={cat}>
                <div className="skills-showcase-cat">{cat}</div>
                <div className="skills-showcase-chips">
                  {skills.map(s => (
                    <div className="skills-showcase-chip" key={s.id}>
                      <span>{s.icon}</span>
                      <span>{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="landing-section-cta">
            <Link to="/auth" className="btn btn-secondary">
              Browse all skills <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Integrations showcase ── */}
      <section className="landing-section landing-section-alt">
        <div className="landing-container">
          <div className="landing-section-label">Integrations</div>
          <h2 className="landing-h2">{INTEGRATIONS.length}+ tools you already use</h2>
          <p className="landing-section-sub">
            Connect your analytics, CRM, SEO, and email tools. Save API keys once and the AI
            can reference real data when answering your questions.
          </p>
          <div className="integrations-showcase">
            {integrationsByCategory.map(({ cat, items }) => (
              <div className="integrations-showcase-group" key={cat}>
                <div className="integrations-showcase-cat">{cat}</div>
                <div className="integrations-showcase-chips">
                  {items.map(i => (
                    <div className="integrations-showcase-chip" key={i.id}>{i.name}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI providers ── */}
      <section className="landing-section">
        <div className="landing-container landing-providers">
          <div className="landing-section-label">AI Providers</div>
          <h2 className="landing-h2">Use the model you trust</h2>
          <p className="landing-section-sub">
            Bring your own API key from any supported provider. Switch between them in the chat toolbar.
            Your keys are encrypted and stored securely.
          </p>
          <div className="providers-grid">
            {[
              { name: 'Claude', company: 'Anthropic', badge: 'Recommended', desc: 'Claude 3.5 Sonnet — best for nuanced marketing copy and strategy.' },
              { name: 'OpenRouter', company: 'OpenRouter', badge: '100+ models', desc: 'Access GPT-4o, Llama 3, Mistral, Gemma, and more via one key.' },
              { name: 'Gemini', company: 'Google', badge: 'Fast', desc: 'Gemini 1.5 Pro and Flash — strong long-context reasoning.' },
              { name: 'GPT-4o', company: 'OpenAI', badge: 'Popular', desc: 'OpenAI GPT-4o — widely used, broad capability.' },
            ].map(p => (
              <div className="provider-card" key={p.name}>
                <div className="provider-card-top">
                  <span className="provider-name">{p.name}</span>
                  <span className="provider-badge">{p.badge}</span>
                </div>
                <div className="provider-company">{p.company}</div>
                <p className="provider-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta-section">
        <div className="landing-container">
          <div className="landing-cta-inner">
            <TrendingUp size={32} className="landing-cta-icon" />
            <h2 className="landing-cta-title">Start executing better marketing today</h2>
            <p className="landing-cta-sub">
              Free to use. Bring your own AI key. No lock-in.
            </p>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Open Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/auth" className="btn btn-primary btn-lg">
                Create free account <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-logo">
            <Zap size={16} />
            <span>MarketingSkills</span>
          </div>
          <p className="landing-footer-copy">
            © {new Date().getFullYear()} MarketingSkills. Built for technical marketers and founders.
          </p>
        </div>
      </footer>
    </div>
  )
}
