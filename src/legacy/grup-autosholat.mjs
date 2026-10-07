// Autosholat — perintah untuk mengaktifkan pengingat & penutupan grup saat waktu sholat.
// Mesin yang berjalan otomatis ada di grup-engine.mjs.
import { createRequire } from 'node:module'
import { CITIES } from './grup-engine.mjs'
const require = createRequire(import.meta.url)
const store = require('../utils/groupStore.js')

const handler = async (m, { conn, args, command, usedPrefix, isBotAdmin }) => {
  const chat = store.getChat(m.chat)

  if (command === 'autosholat') {
    const type = (args[0] || '').toLowerCase()

    if (type === 'on') {
      if (!isBotAdmin) return m.reply('❌ Jadikan bot admin grup dulu supaya bisa membuka/menutup grup.')
      chat.autosholat = true
      store.save()
      return m.reply('🕌 Autosholat aktif')
    }

    if (type === 'off') {
      chat.autosholat = false
      chat.isClosed = false
      chat.jumatClosed = false
      chat.tutupSampai = 0
      store.save()

      try { await conn.groupSettingUpdate(m.chat, 'not_announcement') } catch {}
      return m.reply('❌ Autosholat mati')
    }

    if (type === 'status') {
      return m.reply(
`🕌 *STATUS AUTOSHOLAT*

Status: ${chat.autosholat ? 'Aktif ✅' : 'Mati ❌'}
Kota: ${chat.kota || 'jakarta'}
Tutup Normal: ${chat.isClosed ? 'Ya' : 'Tidak'}
Mode Jumat: ${chat.jumatClosed ? 'Ya' : 'Tidak'}`
      )
    }

    return m.reply(
`🕌 *AUTOSHOLAT*

${usedPrefix}autosholat on
${usedPrefix}autosholat off
${usedPrefix}autosholat status
${usedPrefix}setkota nama_kota

Contoh:
${usedPrefix}setkota bandung`
    )
  }

  if (command === 'setkota') {
    const kota = (args[0] || '').toLowerCase()
    const list = Object.keys(CITIES)

    if (!kota) return m.reply(`Contoh:\n${usedPrefix}setkota bandung\n\nKota tersedia: ${list.join(', ')}`)
    if (!CITIES[kota]) return m.reply(`❌ Kota tidak tersedia.\n\nKota tersedia: ${list.join(', ')}`)

    chat.kota = kota
    store.save()
    return m.reply(`📍 Kota di set ke *${chat.kota}*`)
  }
}

handler.group = true
handler.admin = true

export default handler
