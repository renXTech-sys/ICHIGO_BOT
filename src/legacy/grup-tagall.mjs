// Tag All — mention semua member lengkap dengan daftar nama.
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { generateWAMessageFromContent, proto } = require('@hanzofc/baileys')

const cleanJid = jid => {
  if (!jid) return ''
  if (typeof jid !== 'string') jid = String(jid)
  return jid.replace(/:\d+@/g, '@')
}

const toM = jid => '@' + cleanJid(jid).split('@')[0]

const handler = async (m, { conn, text, participants }) => {
  let teks = `◇───── Tag All ─────◇
乂 *Pesan : ${text ? text : 'kosong'}*

`
  const mentions = []

  for (const mem of participants) {
    const jid = cleanJid(mem.jid || mem.phoneNumber || mem.participant || mem.id || mem.lid)
    if (!jid || mentions.includes(jid)) continue

    teks += `• ${toM(jid)}\n`
    mentions.push(jid)
  }

  const msg = generateWAMessageFromContent(
    m.chat,
    {
      extendedTextMessage: proto.Message.ExtendedTextMessage.fromObject({
        text: teks,
        contextInfo: { mentionedJid: mentions }
      })
    },
    { quoted: m }
  )

  await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}

handler.group = true
handler.admin = true

export default handler
