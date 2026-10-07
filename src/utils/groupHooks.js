// Hook per-pesan untuk fitur grup (dipanggil dari messageHandler sebelum command diproses):
//  1. Catat aktivitas member          → dipakai .sider
//  2. Anti-bypass autosholat          → hapus pesan non-admin saat grup sedang ditutup
//  3. Awalan "@all" / "@semua" (admin) → hidetag tanpa perlu prefix
// Mengembalikan true kalau pesan sudah ditangani (messageHandler lalu lanjut ke pesan berikutnya).
const store = require('./groupStore');
const gctx = require('./groupContext');
const legacy = require('./legacyBridge');

const ALL_REGEX = /^@(all|semua)(?:\s+([\s\S]*))?$/i;

async function process(Hanz, msg, sender, text, isOwner) {
    if (!sender.endsWith('@g.us') || msg.key.fromMe) return false;

    // 1) catat aktivitas
    const ids = [...gctx.senderIds(msg)];
    if (ids.length) store.touch(sender, ids);

    const chat = store.allChats()[sender];

    // 2) anti-bypass autosholat
    if (chat?.autosholat && (chat.isClosed || chat.jumatClosed) && !isOwner) {
        try {
            const ctx = await gctx.getContext(Hanz, msg);
            if (!ctx.isAdmin && ctx.isBotAdmin) {
                await Hanz.sendMessage(sender, { delete: msg.key });
                return true;
            }
        } catch {}
    }

    // 3) @all / @semua — hanya untuk admin; selain itu pesan diabaikan seperti chat biasa
    const match = text && text.match(ALL_REGEX);
    if (match) {
        try {
            const ctx = await gctx.getContext(Hanz, msg);
            if (!(ctx.isAdmin || isOwner)) return false;

            const teks = match[2] || '';
            await legacy.run('grup-hidetag.mjs', 'hidetag', {
                Hanz, msg, sender,
                isGroup: true,
                isOwner,
                command: { name: 'hidetag', args: teks ? teks.split(/ +/) : [], fullArgs: teks },
                react: (emoji) => Hanz.sendMessage(sender, { react: { text: emoji, key: msg.key } }),
                reply: (content) => Hanz.sendMessage(sender, content, { quoted: msg }),
            });
            return true;
        } catch (e) {
            console.error('[GROUP-HOOK] @all:', e.message);
        }
    }

    return false;
}

module.exports = { process };
