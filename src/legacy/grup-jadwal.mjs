// Jadwal buka/tutup grup otomatis. Eksekusi jadwalnya ada di grup-engine.mjs.
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const store = require('../utils/groupStore.js')

const handler = async (m, { text, command, usedPrefix }) => {
  const chat = store.getChat(m.chat)

  if (command === 'jadwal') {
    return m.reply(`
📅 *JADWAL OTOMATIS GRUP*

🔓 Buka Grup : ${chat.openTime || 'Belum diatur'}
🔒 Tutup Grup : ${chat.closeTime || 'Belum diatur'}
`.trim())
  }

  if (command === 'hapusbukajam') {
    if (!chat.openTime) return m.reply('❌ Jadwal buka grup belum diatur.')
    delete chat.openTime
    store.save()
    return m.reply('✅ Jadwal buka grup berhasil dihapus.')
  }

  if (command === 'hapustutupjam') {
    if (!chat.closeTime) return m.reply('❌ Jadwal tutup grup belum diatur.')
    delete chat.closeTime
    store.save()
    return m.reply('✅ Jadwal tutup grup berhasil dihapus.')
  }

  if (command === 'hapusjadwal') {
    delete chat.openTime
    delete chat.closeTime
    store.save()
    return m.reply('✅ Semua jadwal buka & tutup grup berhasil dihapus.')
  }

  let [jm, mnt] = text.split(':')

  if (!jm || !mnt) {
    return m.reply(`Contoh:\n${usedPrefix}${command} 18:00`)
  }

  jm = parseInt(jm)
  mnt = parseInt(mnt)

  if (isNaN(jm) || jm < 0 || jm > 23) return m.reply('❗ Jam harus antara 0 - 23')
  if (isNaN(mnt) || mnt < 0 || mnt > 59) return m.reply('❗ Menit harus antara 0 - 59')

  const waktu = `${String(jm).padStart(2, '0')}:${String(mnt).padStart(2, '0')}`

  if (command === 'bukajam') {
    chat.openTime = waktu
    store.save()
    return m.reply(`✅ Jadwal buka grup berhasil diatur ke ${waktu} WIB`)
  }

  if (command === 'tutupjam') {
    chat.closeTime = waktu
    store.save()
    return m.reply(`✅ Jadwal tutup grup berhasil diatur ke ${waktu} WIB`)
  }
}

handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
