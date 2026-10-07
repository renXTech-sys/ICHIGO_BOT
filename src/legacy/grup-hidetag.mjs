// Hidetag — kirim pesan yang me-mention semua member tanpa menampilkan daftar nama.
// Juga dipakai oleh awalan "@all" / "@semua" (lihat src/utils/groupHooks.js).
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { generateWAMessageFromContent, proto } = require('@hanzofc/baileys')

const cleanJid = jid => {
  if (!jid) return ''
  if (typeof jid !== 'string') jid = String(jid)
  return jid.replace(/:\d+@/g, '@')
}

const getMentions = participants => {
  const mentions = []
  for (const mem of participants || []) {
    const jid = cleanJid(mem.jid || mem.phoneNumber || mem.participant || mem.id || mem.lid)
    if (jid && !mentions.includes(jid)) mentions.push(jid)
  }
  return mentions
}

// Tipe pesan media yang punya caption
const CAPTION_TYPES = ['imageMessage', 'videoMessage', 'documentMessage']

const sendHidetag = async (conn, m, teks, mentions) => {
  // Reply ke media → kirim ulang media itu dengan caption baru + mention
  const media = m.quoted?.mediaMessage
  if (media) {
    const type = Object.keys(media)[0]
    if (CAPTION_TYPES.includes(type)) {
      const node = JSON.parse(JSON.stringify(media[type]))
      node.caption = teks
      node.contextInfo = { ...(node.contextInfo || {}), mentionedJid: mentions }
      const msg = generateWAMessageFromContent(m.chat, { [type]: node }, { quoted: m })
      return conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
    }
  }

  // Teks biasa
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
  return conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}

const handler = async (m, { conn, text, participants }) => {
  const teks = text || m.quoted?.text || m.quoted?.caption || ''
  if (!teks) throw 'Masukin teksnya atau reply pesan yang mau di-hidetag!'

  await sendHidetag(conn, m, teks, getMentions(participants))
}

handler.group = true
handler.admin = true

export default handler
