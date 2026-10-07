const os = require('os');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const brand = require('../utils/brand');
const plugins = require('../utils/PluginLoader');
const { formatUptime } = require('../utils/helper');
const { deliver } = require('../utils/sendMenu');
const { categoryButton } = require('../utils/menuCategories');
const { sendMenuAudio } = require('../utils/menuAudio');

// Ambil video menu: file lokal di src/media/ (Buffer) atau link http(s)
function getMenuVideo() {
    const src = config.menuVideo;
    if (!src) return null;
    if (/^https?:\/\//i.test(src)) return { url: src };

    const file = path.join(__dirname, '../media', src);
    if (!fs.existsSync(file)) {
        console.warn(`[MENU] Video tidak ditemukan: ${file} — menu dikirim tanpa video.`);
        return null;
    }
    return fs.readFileSync(file);
}

const handler = async (m) => {
    const { command, msg, sender, isSuperOwner, isOwner } = m;
    const p = config.prefix;

    // JID pengirim (di grup = participant, di private = remoteJid)
    const userJid = msg.key.participant || msg.key.remoteJid || sender;
    const tag = userJid.split('@')[0].split(':')[0];

    switch (command.name) {
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

case 'readviewonce': 
case 'rvo': {
    if (!m.quoted) return m.reply(`Reply pesan view once!`)
    if (m.quoted.mtype !== 'viewOnceMessageV2' && m.quoted.mtype !== 'viewOnceMessage') return m.reply(`Ini bukan pesan view once!`)
    let msg = m.quoted.message || m.quoted
    let type = Object.keys(msg)[0]
    let media = await downloadContentFromMessage(msg[type], type === 'imageMessage' ? 'image' : 'video')
    let buffer = Buffer.from([])
    for await (const chunk of media) {
        buffer = Buffer.concat([buffer, chunk])
    }
    if (/video/.test(type)) {
        return conn.sendFile ? conn.sendFile(m.chat, buffer, 'media.mp4', msg[type].caption || '', m) : conn.sendMessage(m.chat, { video: buffer, caption: msg[type].caption || '' }, { quoted: m })
    } else if (/image/.test(type)) {
        return conn.sendFile ? conn.sendFile(m.chat, buffer, 'media.jpg', msg[type].caption || '', m) : conn.sendMessage(m.chat, { image: buffer, caption: msg[type].caption || '' }, { quoted: m })
    }
}
break

case 'hitungwr': {
    if (!text) return m.reply("Contoh: *.hitungwr 650 58 89*")
    let [tm, tw, mw] = text.split(" ")
    if (isNaN(tm) || !tm) return m.reply("Masukkan total Match!")
    if (isNaN(tw) || !tw) return m.reply("Masukkan total Winrate saat ini!")
    if (isNaN(mw) || !mw) return m.reply("Masukkan target Winrate!")
    
    let TotalMatch = parseFloat(tm)
    let TotalWr = parseFloat(tw)
    let MauWr = parseFloat(mw)

    if (MauWr >= 100) return m.reply("Mana bisa mencapai 100% Winrate 😂")
    if (MauWr <= TotalWr) return m.reply("Target Winrate harus lebih besar dari Winrate saat ini!")

    let tWin = TotalMatch * (TotalWr / 100)
    let tLose = TotalMatch - tWin
    let sisaWr = 100 - MauWr
    let wrResult = 100 / sisaWr
    let seratusPersen = tLose * wrResult
    let final = Math.round(seratusPersen - TotalMatch)

    m.reply(`Kamu memerlukan sekitar *${final}* win tanpa lose untuk mendapatkan win rate *${MauWr}%*`)
}
break

        case 'menu': {
            const buttons = [categoryButton()];

            await deliver(m, {
                text: '',
                footer: brand.footer,
                buttons,
                userJid,
                video: getMenuVideo()
            });

            // Setelah menu keluar → kirim audio sebagai voice note
            await sendMenuAudio(m);
            break;
        }

        case 'allmenu': {
            const hidden = new Set(['menu', 'allmenu', 'ownermenu', 'toolsmenu', 'stickermenu', 'downloadermenu', 'animemenu', 'panelmenu', 'gamemenu', 'grupmenu']);
            // grup file yang tidak boleh tampil di allmenu (mis. sisa file lama)
            const hiddenFiles = new Set(['toolsx']);
            const groups = Object.entries(plugins.commandsByFile())
                .filter(([file]) => !hiddenFiles.has(file.toLowerCase()))
                .map(([file, cmds]) => [file, cmds.filter(c => !hidden.has(c))])
                .filter(([, cmds]) => cmds.length > 0);

            const list = groups.map(([file, cmds]) =>
                ` ┌─ ✧ *${file.toUpperCase()}*\n` +
                cmds.map(c => ` │ ⊳ ${p}${c}`).join('\n') +
                `\n └───────────────`
            ).join('\n\n');

            await deliver(m, {
                text: `*ALL MENU*\n\n${list || 'Belum ada command.'}`,
                footer: brand.footer,
                buttons: [],
                userJid,
                video: null
            });
            break;
        }
    }
};

module.exports = handler;
