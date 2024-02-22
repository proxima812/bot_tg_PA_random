import { Bot } from 'grammy';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Bot(process.env.TOKEN);
const chatId = -1002084678955

async function sendMessage() {
  try {
    await bot.api.sendMessage(chatId, "Ваше сообщение здесь");
    console.log("Сообщение успешно отправлено");
  } catch (error) {
    console.error("Ошибка при отправке сообщения:", error);
  }
}

// Обработчик запроса
export default async function handler(req, res) {
  // Проверка авторизации
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  // Попытка отправить сообщение и ответить на запрос
  try {
    await sendMessage();
    res.status(200).end('Hello Cron! Сообщение отправлено.');
  } catch (error) {
    res.status(500).end('Ошибка при отправке сообщения.');
  }
}
