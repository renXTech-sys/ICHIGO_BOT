// Simulasi event grup (welcome/bye/promote/demote).
// Event dikirim ke listener 'group-participants.update' milik bot.
const handler = async (m, { conn, usedPrefix, command, args }) => {
    const event = args[0]
    if (!event) {
        return m.reply(
`contoh:
${usedPrefix + command} welcome @user
${usedPrefix + command} bye @user
${usedPrefix + command} promote @user
${usedPrefix + command} demote @user`)
    }

    if (!m.isGroup) return m.reply('❌ Simulasi hanya bisa dipakai di dalam grup.')

    const part = m.mentionedJid?.[0] || m.sender
    let act

    switch (event.toLowerCase()) {
        case 'add':
        case 'invite':
        case 'welcome':
            act = 'add'
            break
        case 'bye':
        case 'kick':
        case 'leave':
        case 'remove':
            act = 'remove'
            break
        case 'promote':
            act = 'promote'
            break
        case 'demote':
            act = 'demote'
            break
        default:
            return m.reply('❌ Event tidak dikenal. Pilih: welcome, bye, promote, demote.')
    }

    await m.reply(`*Simulating ${event}...*`)

    // simulate: true → hook blacklist melewati event ini (tidak ada yang benar-benar dikick)
    conn.ev.emit('group-participants.update', {
        id: m.chat,
        author: m.sender,
        participants: [part],
        action: act,
        simulate: true
    })
}

export default handler
