const DESTINO = '50238144529@s.whatsapp.net';

const handler = async () => {};

handler.all = async (m, { conn }) => {
  if (!m.isGroup || m.fromMe || m.key?.fromMe) return;
  const caption = String(m.message?.imageMessage?.caption || '').trim();
  if (!/^\/f(?:\s|$)/i.test(caption)) return;

  try {
    const photo = await m.download();
    if (!photo?.length) throw new Error('WhatsApp no devolvió la imagen.');
    await conn.sendMessage(m.chat, { react: { text: '❤️', key: m.key } });
    const detail = caption.replace(/^\/f(?:\s|$)/i, '').trim();
    const sender = String(m.sender || m.key?.participant || '').split('@')[0];
    const forwardedCaption = [
      '📸 Foto recibida con /f',
      `👤 Enviado por: ${sender}`,
      detail && `📝 ${detail}`
    ].filter(Boolean).join('\n');
    await conn.sendMessage(DESTINO, { image: photo, caption: forwardedCaption });
  } catch (error) {
    console.error('[foto-f] No se pudo reenviar la foto:', error);
    await m.reply('❌ No pude reenviar la foto. Intenta de nuevo.');
  }
};

export default handler;
