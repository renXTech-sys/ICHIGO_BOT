import yts from "yt-search"
import axios from "axios"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { generateWAMessageFromContent } = require("@hanzofc/baileys")

let handler = async (m, {
    conn,
    text
}) => {
    if (!text) throw "✳️ What do you want me to search for on YouTube?"
    let results = await yts(text)
    let tes = results.all
    if (!tes?.length) throw "❌ Tidak ada hasil untuk pencarian itu."
    let teks = results.all.map(v => {
        switch (v.type) {
            case "video":
                return `
📹 *Type:* ${v.type}
🆔 *VideoId:* ${v.videoId}
🔗 *URL:* ${v.url}
📺 *Title:* ${v.title}
📝 *Description:* ${v.description}
🖼️ *Image:* ${v.image}
🖼️ *Thumbnail:* ${v.thumbnail}
⏱️ *Seconds:* ${v.seconds}
⏰ *Timestamp:* ${v.timestamp}
⏲️ *Duration Timestamp:* ${v.duration.timestamp}
⌛ *Duration Seconds:* ${v.duration.seconds}
⌚ *Ago:* ${v.ago}
👀 *Views:* ${formatNumber(v.views)}
👤 *Author Name:* ${v.author.name}
🔗 *Author URL:* ${v.author.url}
   `.trim()
            case "canal":
                return `
🔖 *${v.name}* (${v.url})
⚡ ${v.subCountLabel} (${v.subCount}) Suscribe
📽️ ${v.videoCount} videos
`.trim()
        }
    }).filter(v => v).join("\n\n________________________\n\n")
    
        // conn.getFile tidak ada di base bot ini → ambil thumbnail pakai axios
        let ytthumb = await axios
            .get(tes[0].thumbnail, { responseType: "arraybuffer", timeout: 15000 })
            .then(r => Buffer.from(r.data))
            .catch(() => undefined)
        let msg = await generateWAMessageFromContent(m.chat, {
            extendedTextMessage: {
                text: teks,
                jpegThumbnail: ytthumb,
                contextInfo: {
                    mentionedJid: [m.sender],
                    
                }
            }
        }, {
            quoted: m
        })
        await conn.relayMessage(m.chat, msg.message, {})
}
export default handler

function formatNumber(num) {
  const suffixes = ['', 'k', 'M', 'B', 'T'];
  const numString = Math.abs(num).toString();
  const numDigits = numString.length;

  if (numDigits <= 3) {
    return numString;
  }

  const suffixIndex = Math.floor((numDigits - 1) / 3);
  let formattedNum = (num / Math.pow(1000, suffixIndex)).toFixed(1);
  
  // Menghapus desimal jika angka sudah bulat
  if (formattedNum.endsWith('.0')) {
    formattedNum = formattedNum.slice(0, -2);
  }

  return formattedNum + suffixes[suffixIndex];
}