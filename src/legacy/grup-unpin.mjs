// Unpin — lepas pin pesan yang di-reply.
const handler = async (m, { conn }) => {
  if (!m.quoted) throw 'Balas pesan yang ingin di-unpin!'

  await conn.sendMessage(m.chat, {
    pin: {
      remoteJid: m.quoted.chat,
      fromMe: false,
      id: m.quoted.id,
      participant: m.quoted.sender
    },
    type: 2
  })

  m.reply('✅ Pin pesan berhasil dihapus.')
}

handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
