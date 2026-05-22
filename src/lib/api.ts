import { supabase } from './supabase'

export const getCurrentUser = async (telegramId: number) => {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()
  return data
}

export const onboardUser = async (userData: {
  telegram_id: number
  username: string
  name: string
  role: string
  tags: string[]
  ai_facts: string[]
}) => {
  const refCode = `REF_${userData.telegram_id}`
  const { data } = await supabase
    .from('users')
    .upsert({ ...userData, ref_code: refCode })
    .select()
    .single()
  return data
}

export const getProfiles = async (currentUserId: string, currentTags: string[]) => {
  const { data: swiped } = await supabase
    .from('swipes')
    .select('swiped_id')
    .eq('swiper_id', currentUserId)

  const swipedIds = swiped?.map((s) => s.swiped_id) || []
  swipedIds.push(currentUserId)

  const { data } = await supabase
    .from('users')
    .select('*')
    .not('id', 'in', `(${swipedIds.join(',')})`)
    .overlaps('tags', currentTags)
    .order('created_at', { ascending: false })
    .limit(20)

  return data || []
}

export const recordSwipe = async (
  swiperId: string,
  swipedId: string,
  direction: 'like' | 'pass'
) => {
  await supabase.from('swipes').insert({ swiper_id: swiperId, swiped_id: swipedId, direction })

  if (direction === 'like') {
    const { data: mutual } = await supabase
      .from('swipes')
      .select('id')
      .eq('swiper_id', swipedId)
      .eq('swiped_id', swiperId)
      .eq('direction', 'like')
      .single()

    if (mutual) {
      await supabase.functions.invoke('notify-match', { body: { userAId: swiperId, userBId: swipedId } })
      return { match: true }
    }
  }
  return { match: false }
}

export const generateAiFacts = async (role: string, tags: string[]) => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: `User is a ${role}, interested in: ${tags.join(', ')}.\nGenerate exactly 3 short punchy facts in internet culture tone. \nEach fact max 8 words. Return ONLY a JSON array of 3 strings.\nExample: ["probably has 12 unfinished side projects",\n"sends voice messages at 2AM", "thinks in systems talks in memes"]` }],
      temperature: 0.9
    })
  })
  const data = await response.json()
  const text = data.choices[0].message.content
  try { return JSON.parse(text) } catch {
    return [
      'probably has 12 unfinished side projects',
      'sends voice messages at 2AM',
      'thinks in systems, talks in memes'
    ]
  }
}

export const getVibeReason = async (myTags: string[], theirTags: string[]) => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: `Tags A: ${myTags.join(', ')}. Tags B: ${theirTags.join(', ')}.\nONE casual funny sentence why they vibe. Max 12 words. \nNo hashtags. Internet humor. Return plain text only.` }],
      temperature: 1.0
    })
  })
  const data = await response.json()
  return data.choices[0].message.content.trim()
}
