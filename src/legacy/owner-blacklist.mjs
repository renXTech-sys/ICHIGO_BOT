// Blacklist user — user yang di-blacklist otomatis dikeluarkan bot saat masuk grup
// (penegakan ada di hook 'group-participants.update' pada index.js).
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const store = require('../utils/ownerStore.js')

const COLLECTION = 'blacklistUser'

const getTarget = (m, args = []) => {
    if (m.quoted?.sender) return m.quoted.sender
    if (m.mentionedJid?.length) return m.mentionedJid[0]
    const number = args[0]?.replace(/\D/g, '')
    return number || ''
}

const handler = async (m, { args, isOwner, usedPrefix, command }) => {
    if (!isOwner) return m.reply('❌ Command ini khusus owner.')

    const raw = getTarget(m, args)
    const number = store.toNumber(raw)

    if (!number) {
        return m.reply(
            `🚫 *BLACKLIST USER*\n\n` +
            `Cara penggunaan:\n\n` +
            `• ${usedPrefix + command} @user\n` +
            `• ${usedPrefix + command} 628xxxxxxxxxx\n` +
            `• Reply pesan lalu ketik ${usedPrefix + command}\n\n` +
            `Contoh:\n` +
            `${usedPrefix + command} 628123456789`
        )
    }

    if (number === store.toNumber(m.sender))
        return m.reply('Jangan blacklist diri sendiri.')

    const list = store.getCollection(COLLECTION)

    if (list[number])
        return m.reply(`⚠️ ${number} sudah ada di blacklist.`)

    list[number] = {
        addedAt: Date.now(),
        addedBy: store.toNumber(m.sender)
    }
    store.setCollection(COLLECTION, list)

    const jid = `${number}@s.whatsapp.net`
    return m.reply(
        `🔴 *USER DI-BLACKLIST*\n\n` +
        `👤 User: @${number}\n` +
        `📌 Status: BLACKLIST\n\n` +
        `Jika user tersebut masuk grup, bot akan otomatis mengeluarkannya (bot harus jadi admin grup).`,
        null,
        { mentions: [jid] }
    )
}

export default handler
