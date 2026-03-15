import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowRight, BookOpen } from 'lucide-react'
import { SKILLS, SKILL_CATEGORIES, type Skill } from '../data/skills'

export default function SkillsPage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const categories = ['All', ...SKILL_CATEGORIES]

  const filtered = SKILLS.filter(skill => {
    const matchesQuery =
      query === '' ||
      skill.name.toLowerCase().includes(query.toLowerCase()) ||
      skill.description.toLowerCase().includes(query.toLowerCase()) ||
      skill.triggers.some(t => t.toLowerCase().includes(query.toLowerCase()))

    const matchesCategory = activeCategory === 'All' || skill.category === activeCategory

    return matchesQuery && matchesCategory
  })

  const grouped = categories
    .filter(c => c !== 'All')
    .map(category => ({
      category,
      skills: filtered.filter(s => s.category === category),
    }))
    .filter(g => g.skills.length > 0)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Skills Library</h1>
          <p className="page-sub">{SKILLS.length} marketing skills powered by Claude AI</p>
        </div>
      </div>

      <div className="skills-toolbar">
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search skills..."
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

      {filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={40} />
          <p>No skills match your search</p>
        </div>
      ) : activeCategory === 'All' ? (
        <div className="skills-grouped">
          {grouped.map(({ category, skills }) => (
            <div key={category} className="skill-group">
              <h2 className="skill-group-title">{category}</h2>
              <div className="skills-grid">
                {skills.map(skill => <SkillCard key={skill.id} skill={skill} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="skills-grid">
          {filtered.map(skill => <SkillCard key={skill.id} skill={skill} />)}
        </div>
      )}
    </div>
  )
}

function SkillCard({ skill }: { skill: Skill }) {
  return (
    <div className="skill-card">
      <div className="skill-card-icon">{skill.icon}</div>
      <div className="skill-card-body">
        <h3 className="skill-card-name">{skill.name}</h3>
        <p className="skill-card-desc">{skill.description}</p>
        <div className="skill-triggers">
          {skill.triggers.slice(0, 3).map(t => (
            <span className="skill-trigger" key={t}>{t}</span>
          ))}
        </div>
      </div>
      <Link to={`/chat?skill=${skill.id}`} className="skill-card-cta">
        Use skill <ArrowRight size={14} />
      </Link>
    </div>
  )
}
