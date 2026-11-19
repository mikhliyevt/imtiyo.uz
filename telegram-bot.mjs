const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  '9107518968:AAGsHZQHUDEvq7S6t6kBKspooSbARbc37No';

const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
let offset = 0;

// Har bir foydalanuvchi uchun saytdan kelgan sessiyani saqlash:
// chatId -> { expectedDigits, code, expiresAtMs }
const activeSessions = new Map();

function decodeStartToken(token) {
  try {
    if (!token || !token.startsWith('s_')) return null;
    const hex = token.slice(2);
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
    }
    // Format: <9xonaTel>_<6xonaKod>_<expSec>
    const match = str.match(/^(\d{9})_(\d{6})_(\d+)$/);
    if (!match) return null;
    return {
      expectedDigits: match[1],
      code: match[2],
      expiresAtMs: Number(match[3]) * 1000,
    };
  } catch {
    return null;
  }
}

async function sendMessage(chatId, text, replyMarkup = undefined) {
  await fetch(`${API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  });
}

async function poll() {
  try {
    const res = await fetch(`${API_URL}/getUpdates?offset=${offset}&timeout=15`);
    const data = await res.json();

    if (data?.error_code === 409) {
      await fetch(`${API_URL}/deleteWebhook`);
    }

    if (data?.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        const msg = update.message;
        if (!msg?.chat?.id) continue;

        const chatId = msg.chat.id;
        const text = String(msg.text || '').trim();

        // 1. /start buyrug'i kelganda
        if (text.startsWith('/start')) {
          const parts = text.split(' ');
          const startParam = parts[1] || '';

          // Agar foydalanuvchi saytdagi tugmasiz shunchaki Telegramdan /start bosgan bo'lsa:
          const decoded = decodeStartToken(startParam);
          if (!decoded) {
            await sendMessage(
              chatId,
              '❌ <b>Kirish havolasi noto‘g‘ri yoki qo‘llab-quvvatlanmaydi.</b>\n\nIltimos, ro‘yxatdan o‘tish va kod olish uchun <b>imtiyo.uz</b> saytidagi «Telegram orqali kod olish» tugmasi orqali kiring.',
              { remove_keyboard: true }
            );
            continue;
          }

          // Agar 1 daqiqalik (60 soniya) havola muddati o'tib ketgan bo'lsa:
          if (Date.now() > decoded.expiresAtMs) {
            await sendMessage(
              chatId,
              '⏳ <b>Kirish havolasining amal qilish muddati (1 daqiqa) tugagan!</b>\n\nIltimos, saytda «Kodni qayta yuborish» tugmasini bosib, qaytadan botga o‘ting.',
              { remove_keyboard: true }
            );
            continue;
          }

          // Sessiyani saqlaymiz va foydalanuvchidan raqamini ulashishni so'raymiz
          activeSessions.set(chatId, decoded);

          await sendMessage(
            chatId,
            `👋 <b>IMTIYO</b> tasdiqlash botiga xush kelibsiz!\n\n📱 Saytda kiritilgan raqam: <b>+998 ${decoded.expectedDigits}</b>\n\n👇 Tasdiqlash kodini olish uchun pastdagi <b>«📱 Telefon raqamni yuborish»</b> tugmasini bosing:`,
            {
              keyboard: [[{ text: '📱 Telefon raqamni yuborish', request_contact: true }]],
              resize_keyboard: true,
              one_time_keyboard: true,
            }
          );
          continue;
        }

        // 2. Foydalanuvchi telefon raqamini (Kontakt) yuborganda
        if (msg.contact && msg.contact.phone_number) {
          const session = activeSessions.get(chatId);

          // Agar saytdagi havola orqali kirmagan bo'lsa:
          if (!session) {
            await sendMessage(
              chatId,
              '❌ <b>Kirish havolasi noto‘g‘ri yoki qo‘llab-quvvatlanmaydi.</b>\n\nAvval saytdagi «Telegram orqali kod olish» tugmasini bosing.',
              { remove_keyboard: true }
            );
            continue;
          }

          // Agar 1 daqiqa o'tib ketgan bo'lsa:
          if (Date.now() > session.expiresAtMs) {
            activeSessions.delete(chatId);
            await sendMessage(
              chatId,
              '⏳ <b>Kodning amal qilish muddati (1 daqiqa) tugadi!</b>\n\nSaytda «Kodni qayta yuborish» tugmasini bosing va qaytadan urinib ko‘ring.',
              { remove_keyboard: true }
            );
            continue;
          }

          // Birovning kontaktini yuborgan bo'lsa:
          if (msg.contact.user_id && msg.from?.id && msg.contact.user_id !== msg.from.id) {
            await sendMessage(
              chatId,
              '❌ Faqat o‘zingizning Telegram hisobingizga ulangan raqamni pastdagi tugma orqali yuborishingiz mumkin!'
            );
            continue;
          }

          const tgDigits = String(msg.contact.phone_number).replace(/\D/g, '').slice(-9);

          // Raqam saytdagi raqam bilan mos kelmasa:
          if (tgDigits !== session.expectedDigits) {
            await sendMessage(
              chatId,
              `❌ <b>Raqam mos kelmadi!</b>\n\nSizning Telegram raqamingiz: <b>+998 ${tgDigits}</b>\nSaytda kiritilgan raqam: <b>+998 ${session.expectedDigits}</b>\n\nIltimos, saytga ham aynan shu Telegram ochilgan raqamingizni kiriting!`,
              { remove_keyboard: true }
            );
            continue;
          }

          // Raqam 100% mos keldi va 1 daqiqalik vaqt ichida -> AYNAN SAYT KUTAYOTGAN KODNI BERAMIZ!
          const remainingSec = Math.max(1, Math.round((session.expiresAtMs - Date.now()) / 1000));
          await sendMessage(
            chatId,
            `✅ <b>Raqamingiz tasdiqlandi!</b> (+998 ${tgDigits})\n\n🔐 Sizning tasdiqlash kodingiz:\n\n<code>${session.code}</code>\n\n⏳ Kod <b>${remainingSec} soniya</b> davomida amal qiladi. Uni saytdagi kiritish maydoniga yozing.`,
            { remove_keyboard: true }
          );
          console.log(`✅ +998${tgDigits} uchun sayt kodi berildi: ${session.code}`);
        }
      }
    }
  } catch (err) {
    console.error('Bot xatosi:', err.message);
  }
  setTimeout(poll, 1000);
}

fetch(`${API_URL}/deleteWebhook`)
  .then(() => {
    console.log('🚀 @imtiyokod_bot (1 daqiqalik shifrlangan havola rejimi) ishga tushdi!');
    poll();
  })
  .catch(() => poll());