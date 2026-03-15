import { SKILLS } from '../data/skills'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function sendMessage(
  messages: Message[],
  apiKey: string,
  skillId: string | null,
  productContext: string | null
): Promise<string> {
  const skill = skillId ? SKILLS.find(s => s.id === skillId) : null

  const systemParts: string[] = []

  systemParts.push(`You are an expert AI marketing assistant specializing in growth, conversion optimization, copywriting, SEO, and all aspects of B2B/B2C marketing strategy. You help technical marketers, founders, and product teams execute marketing tasks with precision and expertise.`)

  if (skill) {
    systemParts.push(`\n## Active Skill: ${skill.name}\n${skill.description}\n\nFocus your responses on ${skill.name} tasks. Provide specific, actionable recommendations structured clearly.`)
  }

  if (productContext) {
    systemParts.push(`\n## Product Marketing Context\n\nThe user has provided product context. Use this to personalize all recommendations:\n\n${productContext}`)
  }

  systemParts.push(`\n## Response Guidelines\n- Be specific and actionable, not generic\n- Structure responses with clear sections and headers when appropriate\n- Prioritize recommendations by impact\n- Use the customer's language when possible\n- Ask clarifying questions when you need more information to give useful advice`)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemParts.join('\n'),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = (err as { error?: { message?: string } }).error?.message ?? `API error ${response.status}`
    throw new Error(msg)
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>
  }
  return data.content[0]?.text ?? ''
}
