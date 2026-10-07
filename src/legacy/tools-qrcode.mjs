let handler = async (m, { conn, text, usedPrefix, command }) => {
	if (!text) return m.reply(`Use example: \n${usedPrefix + command} <teks>`);
	conn.sendFile(m.chat, `https://quickchart.io/qr?text=${encodeURIComponent(text)}`, 'qrcode.png', '¯\\_(ツ)_/¯', m);
};

handler.help = ['qrcode <teks>'];
handler.tags = ['tools'];
handler.command = /^qr(code)?$/i;

export default handler;
