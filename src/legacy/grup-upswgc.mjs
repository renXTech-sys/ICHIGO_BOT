// Upswgc — posting status grup dari teks atau media yang di-reply.
// (Command dinamai upswgc karena .swgc sudah dipakai fitur owner.)
import { randomBytes } from 'node:crypto'

const STATUS_CONTEXT = {
  statusSourceType: 4,
  statusAttributions: [{ type: 10 }],
  statusAudienceMetadata: { audienceType: 1 }
}

const textStatus = text => ({
  extendedTextMessage: {
    text,
    textArgb: 4294967295,
    backgroundArgb: 4280669030,
    font: 5,
    previewType: 0,
    contextInfo: {
      forwardingScore: 0,
      featureEligibilities: {
        canBeReshared: true,
        canReceiveMultiReact: true
      },
      ...STATUS_CONTEXT
    },
    inviteLinkGroupTypeV2: 0
  }
})

const handler = async (m, { conn, text, usedPrefix, command }) => {
  let message

  if (m.quoted?.mediaMessage) {
    const mediaType = Object.keys(m.quoted.mediaMessage)[0]
    const media = JSON.parse(JSON.stringify(m.quoted.mediaMessage[mediaType]))
    media.contextInfo = { ...(media.contextInfo || {}), ...STATUS_CONTEXT }
    message = { [mediaType]: media }
  } else if (m.quoted) {
    message = textStatus(m.quoted.text || m.quoted.caption || '')
  } else if (text) {
    message = textStatus(text)
  } else {
    return m.reply(`Contoh:\n${usedPrefix + command} Halo semua\n\nAtau reply media/pesan`)
  }

  try {
    await conn.relayMessage(
      m.chat,
      {
        messageContextInfo: { messageSecret: randomBytes(32) },
        groupStatusMessageV2: { message }
      },
      {}
    )
    m.reply('✅ Status grup berhasil dikirim')
  } catch (e) {
    console.error(e)
    m.reply(`❌ Gagal mengirim status grup\n\n${e.message || e}`)
  }
}

handler.group = true
handler.admin = true

export default handler
