const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')

Deno.serve(async (req) => {
  const { userA, userB } = await req.json()
  
  const send = (chatId: number, username: string) =>
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `⚡ vibe match! say hi → @${username}`
      })
    })

  await Promise.all([
    send(userA.telegram_id, userB.username),
    send(userB.telegram_id, userA.username)
  ])

  return new Response('ok')
})