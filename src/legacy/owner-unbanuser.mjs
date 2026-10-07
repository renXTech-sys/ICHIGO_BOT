// Unban user — menghapus user dari daftar banned (src/database/owner-data.json).
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const store = require('../utils/ownerStore.js')

const COLLECTION = 'bannedUser'

const handler = async (m, { args, usedPrefix, command }) => {
    let raw = m.quoted?.sender || m.mentionedJid?.[0] || args[0] || ''
    const number = store.toNumber(raw)

    if (!number) {
        return m.reply(
            `Siapa yang mau di-unban?\n\n` +
            `• ${usedPrefix + command} @user\n` +
            `• ${usedPrefix + command} 628xxxxxxxxxx\n` +
            `• Reply pesan lalu ketik ${usedPrefix + command}`
        )
    }

    const list = store.getCollection(COLLECTION)
    if (!list[number]) return m.reply(`ℹ️ ${number} tidak ada di daftar banned.`)

    delete list[number]
    store.setCollection(COLLECTION, list)
    m.reply('Success!')
}

export default handler
