import { SKILLS } from '../data/skills'
import { supabase } from './supabase'

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

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      messages,
      apiKey,
      skillId: skillId ?? null,
      skillName: skill?.name ?? null,
      skillDescription: skill?.description ?? null,
      productContext: productContext ?? null,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = (err as { error?: string }).error ?? `Request failed (${response.status})`
    throw new Error(msg)
  }

  const data = await response.json() as { text?: string; error?: string }
  if (data.error) throw new Error(data.error)
  return data.text ?? ''
}
