const config = require('../config');
const brand = require('../utils/brand');
const { deliver } = require('../utils/sendMenu');
const { categoryButton } = require('../utils/menuCategories');
const legacy = require('../utils/legacyBridge');

// Satu fitur = satu file di src/legacy/grup-*.mjs, dijalankan lewat legacyBridge.
// Daftar command di bawah WAJIB literal (PluginLoader membaca teks "case" + nama command).
const handler = async (m) => {
    const { command, msg, sender } = m;
    const p = config.prefix;

    const userJid = msg.key.participant || msg.key.remoteJid || sender;

    switch (command.name) {
        case 'grupmenu': {
            const text =
` ┌─ ✧ *GRUP MENU*
 │ ⊳ ${p}hidetag / ${p}h
 │ ⊳ @all / @semua <teks>
 │ ⊳ ${p}tagall
 │ ⊳ ${p}totag / ${p}tag
 │ ⊳ ${p}linkgc
 │ ⊳ ${p}unpin
 │ ⊳ ${p}upswgc
 │ ⊳ ${p}setintro
 │ ⊳ ${p}intro
 │ ⊳ ${p}delintro
 │ ⊳ ${p}sider
 │ ⊳ ${p}kicksider
 │ ⊳ ${p}resetsider
 │ ⊳ ${p}bukajam
 │ ⊳ ${p}tutupjam
 │ ⊳ ${p}jadwal
 │ ⊳ ${p}hapusbukajam
 │ ⊳ ${p}hapustutupjam
 │ ⊳ ${p}hapusjadwal
 │ ⊳ ${p}autosholat
 │ ⊳ ${p}setkota
 └───────────────`;

            await deliver(m, {
                text,
                footer: brand.footer,
                buttons: [categoryButton()],
                userJid,
                video: null
            });
            break;
        }

        case 'hidetag': return legacy.run('grup-hidetag.mjs', 'hidetag', m);
        case 'h': return legacy.run('grup-hidetag.mjs', 'h', m);
        case 'tagall': return legacy.run('grup-tagall.mjs', 'tagall', m);
        case 'totag': return legacy.run('grup-totag.mjs', 'totag', m);
        case 'tag': return legacy.run('grup-totag.mjs', 'tag', m);
        case 'linkgc': return legacy.run('grup-linkgc.mjs', 'linkgc', m);
        case 'unpin': return legacy.run('grup-unpin.mjs', 'unpin', m);
        case 'upswgc': return legacy.run('grup-upswgc.mjs', 'upswgc', m);
        case 'setintro': return legacy.run('grup-intro.mjs', 'setintro', m);
        case 'intro': return legacy.run('grup-intro.mjs', 'intro', m);
        case 'delintro': return legacy.run('grup-intro.mjs', 'delintro', m);
        case 'sider': return legacy.run('grup-sider.mjs', 'sider', m);
        case 'ceksider': return legacy.run('grup-sider.mjs', 'ceksider', m);
        case 'kicksider': return legacy.run('grup-sider.mjs', 'kicksider', m);
        case 'resetsider': return legacy.run('grup-sider.mjs', 'resetsider', m);
        case 'bukajam': return legacy.run('grup-jadwal.mjs', 'bukajam', m);
        case 'tutupjam': return legacy.run('grup-jadwal.mjs', 'tutupjam', m);
        case 'jadwal': return legacy.run('grup-jadwal.mjs', 'jadwal', m);
        case 'hapusbukajam': return legacy.run('grup-jadwal.mjs', 'hapusbukajam', m);
        case 'hapustutupjam': return legacy.run('grup-jadwal.mjs', 'hapustutupjam', m);
        case 'hapusjadwal': return legacy.run('grup-jadwal.mjs', 'hapusjadwal', m);
        case 'autosholat': return legacy.run('grup-autosholat.mjs', 'autosholat', m);
        case 'setkota': return legacy.run('grup-autosholat.mjs', 'setkota', m);
   case 'kickall': {
    if (!m.isGroup) return m.reply(mess.group || mess.only.group)
    if (!isAdmins && !isCreator) return m.reply(mess.admin || 'Khusus Admin!!')
    if (!isBotAdmins) return m.reply(mess.botAdmin || '_Bot Harus Menjadi Admin Terlebih Dahulu_')
    const users = participants.map(a => a.id)
    await conn.groupParticipantsUpdate(m.chat, users, 'remove')
    await m.reply('Done')
}
break

case 'kick': {
    if (!m.isGroup) return m.reply(mess.group)
    if (!isAdmins && !isGroupOwner && !isCreator) return m.reply(mess.admin)
    if (!isBotAdmins) return m.reply(mess.botAdmin)
    let user = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    if (!user || user === '@s.whatsapp.net') return m.reply('Tag, reply, atau masukkan nomor target!')
    await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
        .then((res) => m.reply(typeof json !== 'undefined' ? json(res) : mess.done || 'Berhasil!'))
        .catch((err) => m.reply(typeof json !== 'undefined' ? json(err) : String(err)))
}
break

case 'add': {
    if (!m.isGroup) return m.reply(mess.group)
    if (!isAdmins && !isGroupOwner && !isCreator) return m.reply(mess.admin)
    if (!isBotAdmins) return m.reply(mess.botAdmin)
    let user = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    if (!user || user === '@s.whatsapp.net') return m.reply('Reply pesan atau masukkan nomor target!')
    await conn.groupParticipantsUpdate(m.chat, [user], 'add')
        .then((res) => m.reply(typeof json !== 'undefined' ? json(res) : mess.done || 'Berhasil!'))
        .catch((err) => m.reply(typeof json !== 'undefined' ? json(err) : String(err)))
}
break

case 'promote': {
    if (!m.isGroup) return m.reply(mess.group)
    if (!isAdmins && !isGroupOwner && !isCreator) return m.reply(mess.admin)
    if (!isBotAdmins) return m.reply(mess.botAdmin)
    let user = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    if (!user || user === '@s.whatsapp.net') return m.reply('Tag, reply, atau masukkan nomor target!')
    await conn.groupParticipantsUpdate(m.chat, [user], 'promote')
        .then((res) => m.reply(typeof json !== 'undefined' ? json(res) : mess.done || 'Berhasil!'))
        .catch((err) => m.reply(typeof json !== 'undefined' ? json(err) : String(err)))
}
break

case 'demote': {
    if (!m.isGroup) return m.reply(mess.group)
    if (!isAdmins && !isGroupOwner && !isCreator) return m.reply(mess.admin)
    if (!isBotAdmins) return m.reply(mess.botAdmin)
    let user = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    if (!user || user === '@s.whatsapp.net') return m.reply('Tag, reply, atau masukkan nomor target!')
    await conn.groupParticipantsUpdate(m.chat, [user], 'demote')
        .then((res) => m.reply(typeof json !== 'undefined' ? json(res) : mess.done || 'Berhasil!'))
        .catch((err) => m.reply(typeof json !== 'undefined' ? json(err) : String(err)))
}
break

case 'setname':
case 'setsubject': {
    if (!m.isGroup) return m.reply(mess.group)
    if (!isAdmins && !isGroupOwner && !isCreator) return m.reply(mess.admin)
    if (!isBotAdmins) return m.reply(mess.botAdmin)
    if (!text) return m.reply('Masukkan teks nama grup!')
    await conn.groupUpdateSubject(m.chat, text)
        .then((res) => m.reply(mess.success || mess.done || 'Berhasil mengubah nama grup!'))
        .catch((err) => m.reply(typeof json !== 'undefined' ? json(err) : String(err)))
}
break

case 'setdesc':
case 'setdesk': {
    if (!m.isGroup) return m.reply(mess.group)
    if (!isAdmins && !isGroupOwner && !isCreator) return m.reply(mess.admin)
    if (!isBotAdmins) return m.reply(mess.botAdmin)
    if (!text) return m.reply('Masukkan teks deskripsi grup!')
    await conn.groupUpdateDescription(m.chat, text)
        .then((res) => m.reply(mess.success || mess.done || 'Berhasil mengubah deskripsi grup!'))
        .catch((err) => m.reply(typeof json !== 'undefined' ? json(err) : String(err)))
}
break

case 'setppgroup':
case 'setppgrup':
case 'setppgc': {
    if (!m.isGroup) return m.reply(mess.group)
    if (!isAdmins) return m.reply(mess.admin)
    if (!isBotAdmins) return m.reply(mess.botAdmin)
    if (!quoted) return m.reply(`Kirim/Reply Gambar Dengan Caption ${prefix + command}`)
    if (!/image/.test(mime)) return m.reply(`Kirim/Reply Gambar Dengan Caption ${prefix + command}`)
    if (/webp/.test(mime)) return m.reply(`Kirim/Reply Gambar Dengan Caption ${prefix + command}`)

    let medis = await conn.downloadAndSaveMediaMessage(quoted, 'ppbot.jpeg')
    if (args[0] === 'full') {
        let { img } = await generateProfilePicture(medis)
        await conn.query({
            tag: 'iq',
            attrs: {
                to: m.chat,
                type: 'set',
                xmlns: 'w:profile:picture'
            },
            content: [{
                tag: 'picture',
                attrs: { type: 'image' },
                content: img
            }]
        })
        if (fs.existsSync(medis)) fs.unlinkSync(medis)
        m.reply(mess.done || mess.success || 'Berhasil!')
    } else {
        await conn.updateProfilePicture(m.chat, { url: medis })
        if (fs.existsSync(medis)) fs.unlinkSync(medis)
        m.reply(mess.done || mess.success || 'Berhasil!')
    }
}
break
    }
};

module.exports = handler;
