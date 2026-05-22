const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req) => {
  const { userAId, userBId } = await req.json()

  const getUser = async (id: string) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
      headers: {
        apikey: SUPABASE_KEY!,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    })
    const data = await res.json()
    return data[0]
  }

  const [userA, userB] = await Promise.all([getUser(userAId), getUser(userBId)])

  const send = (chatId: number, text: string) =>
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    })

  await Promise.all([
    send(userA.telegram_id, `⚡ vibe match! @${userB.username} liked you back. say hi.`),
    send(userB.telegram_id, `⚡ vibe match! @${userA.username} liked you back. say hi.`)
  ])

  return new Response('ok')
})
