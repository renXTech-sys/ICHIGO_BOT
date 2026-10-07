// Link grup — kirim link undangan grup ini.
const handler = async (m, { conn }) => {
  let code
  try {
    code = await conn.groupInviteCode(m.chat)
  } catch {
    throw 'Gagal mengambil link grup. Pastikan bot adalah admin grup.'
  }
  m.reply(`https://chat.whatsapp.com/${code}`)
}

handler.group = true

export default handler
