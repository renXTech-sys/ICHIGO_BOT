// Intro grup — simpan, tampilkan, dan hapus teks intro.
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const store = require('../utils/groupStore.js')

const handler = async (m, { text, command, usedPrefix }) => {
  const chat = store.getChat(m.chat)

  if (command === 'setintro') {
    if (!text) throw `Contoh:\n${usedPrefix}setintro Selamat datang di grup ini`
    chat.intro = text
    store.save()
    return m.reply('✅ Intro grup berhasil disimpan')
  }

  if (command === 'intro') {
    if (!chat.intro) throw 'Intro belum diset'
    return m.reply(chat.intro)
  }

  if (command === 'delintro') {
    delete chat.intro
    store.save()
    return m.reply('🗑️ Intro berhasil dihapus')
  }
}

handler.group = true
// setintro/delintro khusus admin, intro boleh dilihat siapa saja → dicek di handler
const inner = handler
const wrapped = async (m, ctx) => {
  if (ctx.command !== 'intro' && !(ctx.isAdmin || ctx.isOwner)) {
    return m.reply('❌ Command ini khusus admin grup.')
  }
  return inner(m, ctx)
}
wrapped.group = true

export default wrapped
