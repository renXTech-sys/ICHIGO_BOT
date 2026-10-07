/*
  Tolong Jangan Pernah Hapus Watermark Ini
  Script By : JazxCode
  Name Script : Interindah - Assistant MD 
  Version : V1.0
  Follow Saluran : https://whatsapp.com/channel/0029VaylUlU77qVT3vDPjv11
*/
import axios from 'axios'

const API_URL = 'https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/metadata-proxy'
// Bisa diganti lewat env CHANNEL_API_TOKEN tanpa edit file ini
const API_TOKEN = process.env.CHANNEL_API_TOKEN ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzQwNjhiMTE0YWI3MTE5ZmM4NjQ1OCIsImlhdCI6MTc2OTM5MzkzOSwiZXhwIjoxNzY5OTk4NzM5fQ.OidCAKl7zAbum7lgtAqNaFcwV83iXWVtPJAIyVjKHZY'

const extractInviteCode = (input = '') => {
    const match = String(input).match(/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i)
    return match ? match[1] : null
}

let handler = async (m, { text, args, usedPrefix, command }) => {
    const input = (text || args?.join(' ') || m.quoted?.text || '').trim()

    if (!input) {
        return m.reply(
            `🍌 Harap masukkan link channel WhatsApp!\n\n` +
            `Contoh:\n*${usedPrefix || '.'}${command || 'cekidch'} https://whatsapp.com/channel/xxxxxxxx*`
        )
    }

    const code = extractInviteCode(input)
    if (!code) return m.reply('Link tautan tidak valid! Harus link WhatsApp Channel.')

    const url = `https://whatsapp.com/channel/${code}`

    try {
        const { data: channelData } = await axios.get(
            `${API_URL}?url=${encodeURIComponent(url)}`,
            {
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    Authorization: `Bearer ${API_TOKEN}`,
                    'User-Agent':
                        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36',
                    Referer: 'https://asitha.top/channel-manager',
                },
                timeout: 20000,
            }
        )

        if (!channelData?.name || !channelData?.jid) {
            return m.reply('❌ Channel WhatsApp tidak ditemukan atau data tidak lengkap.')
        }

        const followers = channelData.followers
            ? Number(channelData.followers).toLocaleString('id-ID')
            : 'N/A'

        return m.reply(
            `*📱 WhatsApp Channel Information*\n\n` +
            `⌯ *Nama:* ${channelData.name}\n` +
            `⌯ *Followers:* ${followers}\n` +
            `⌯ *ID:* ${channelData.jid}\n` +
            `⌯ *Link:* ${url}`
        )
    } catch (err) {
        const status = err?.response?.status
        console.error('[CEKIDCH]', status || '', err?.message || err)
        const hint = (status === 401 || status === 403)
            ? '\nToken API ditolak/kedaluwarsa, perlu diganti.'
            : ''
        return m.reply(`❌ Gagal mengambil data channel.\nError: ${err.message}${hint}`)
    }
}

handler.help = ['cekidch']
handler.tags = ['tools']
handler.command = ['cekidch', 'idch', 'cekchannel']
export default handler
