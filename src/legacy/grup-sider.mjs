// Sider — daftar member yang tidak aktif ≥ 3 hari, kick sider, reset aktivitas.
// Aktivitas dicatat otomatis oleh src/utils/groupHooks.js di setiap pesan grup.
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const store = require('../utils/groupStore.js')
const gctx = require('../utils/groupContext.js')
const config = require('../config.js')
const { generateWAMessageFromContent, proto } = require('@hanzofc/baileys')

const INACTIVE_TIME = 3 * 24 * 60 * 60 * 1000 // 3 hari
const KICK_DELAY = 1500

const cleanJid = jid => {
  if (!jid) return ''
  if (typeof jid !== 'string') jid = String(jid)
  return jid.replace(/:\d+@/g, '@')
}

const mentionJid = p => cleanJid(p.jid || p.phoneNumber || p.participant || p.id || p.lid)
const toM = jid => '@' + cleanJid(jid).split('@')[0]
const sleep = ms => new Promise(r => setTimeout(r, ms))

const clockString = ms => {
  if (!isFinite(ms)) return 'Belum Pernah Aktif'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor(ms / 60000) % 60
  return `${h}J ${m}M`
}

const sendForceMention = async (conn, m, text, mentions = []) => {
  const msg = generateWAMessageFromContent(
    m.chat,
    {
      extendedTextMessage: proto.Message.ExtendedTextMessage.fromObject({
        text,
        contextInfo: { mentionedJid: mentions }
      })
    },
    { quoted: m }
  )
  await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}

const handler = async (m, { conn, command, participants, groupMetadata }) => {
  const bot = gctx.botIds(conn)
  const owners = new Set(
    [].concat(config.superOwner, config.coOwner || []).map(n => String(n).replace(/\D/g, ''))
  )

  // ========= RESET =========
  if (command === 'resetsider') {
    store.resetSeen(m.chat, participants.map(p => [...gctx.idsOf(p)]))
    return m.reply(`✅ Berhasil reset aktivitas ${participants.length} member grup`)
  }

  // ========= HITUNG SIDER =========
  const since = store.trackingSince(m.chat)
  const trackedLong = since && Date.now() - since > INACTIVE_TIME

  const sider = []
  let belumDihitung = 0

  for (const p of participants) {
    const ids = gctx.idsOf(p)
    if (gctx.intersects(ids, bot)) continue

    const last = store.lastSeen(m.chat, ids)

    if (!last) {
      // Belum pernah terlihat: baru dianggap sider kalau bot sudah mencatat ≥ 3 hari
      if (!trackedLong) { belumDihitung++; continue }
      sider.push({ p, last: 0, ids })
    } else if (Date.now() - last > INACTIVE_TIME) {
      sider.push({ p, last, ids })
    }
  }

  const note = belumDihitung
    ? `\n\n_ℹ️ ${belumDihitung} member belum dihitung: bot baru mencatat aktivitas grup ini ${clockString(Date.now() - (since || Date.now()))} lalu._`
    : ''

  // ========= KICK =========
  if (command === 'kicksider') {
    // Admin & owner tidak pernah di-kick
    const targets = sider.filter(s =>
      !gctx.isAdminParticipant(s.p) && ![...s.ids].some(id => owners.has(id))
    )

    if (!targets.length) return m.reply('Tidak ada sider yang bisa di-kick 🗿' + note)

    const kicked = []
    for (const t of targets) {
      try {
        await conn.groupParticipantsUpdate(m.chat, [t.p.id], 'remove')
        kicked.push(mentionJid(t.p))
      } catch {}
      await sleep(KICK_DELAY)
    }

    if (!kicked.length) return m.reply('Tidak ada sider yang berhasil di-kick 🗿')

    return sendForceMention(conn, m, `✅ Berhasil kick ${kicked.length} sider`, kicked)
  }

  // ========= LIST =========
  if (!sider.length) return m.reply('Tidak ada sider di grup ini 🗿' + note)

  const mentions = []
  const lines = []

  for (const s of sider) {
    const jid = mentionJid(s.p)
    lines.push(`○ ${toM(jid)} (${s.last ? clockString(Date.now() - s.last) : 'Belum Pernah Aktif'})`)
    mentions.push(jid)
  }

  const teks =
`*${sider.length}/${participants.length}* anggota grup *${groupMetadata.subject}* terdeteksi sebagai *sider*

*Perintah Admin:*
🚫 Kick sider
.kicksider

♻️ Reset aktivitas
.resetsider

_“Harap aktif di grup karena akan ada pembersihan member setiap saat”_

*LIST SIDER:*
${lines.join('\n')}${note}`

  await sendForceMention(conn, m, teks, mentions)
}

handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
