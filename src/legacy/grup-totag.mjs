// Totag — teruskan pesan yang di-reply sambil me-mention semua member.
const num = jid => String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '')

const handler = async (m, { conn, participants }) => {
  if (!m.quoted) throw '✳️ Reply Pesan'

  const bot = new Set([num(conn.user?.id), num(conn.user?.lid)])
  const users = participants.map(u => u.id).filter(v => !bot.has(num(v)))

  await conn.sendMessage(m.chat, { forward: m.quoted.fakeObj, mentions: users })
}

handler.group = true
handler.admin = true

export default handler
