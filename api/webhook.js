// https://github.com/yagop/node-telegram-bot-api/issues/319#issuecomment-324963294
// Fixes an error with Promise cancellation
process.env.NTBA_FIX_319 = 'test'

// Подключаем библиотеку Telegram Bot API
const TelegramBot = require('node-telegram-bot-api')

// Массив случайных вопросов
const questions = [
  'Какой твой любимый цвет?',
  'Какая твоя любимая еда?',
  'Какое твое любимое животное?',
  // Дополнительные вопросы

  
]

// Экспортируем функцию как асинхронную
module.exports = async (request, response) => {
  try {
    // Создаем новый экземпляр бота с токеном от BotFather
    const bot = new TelegramBot('6662031438:AAGGh0ZaoFbyDhrlUbr5dotx23QQDOySrUY')

    // Получаем тело POST-запроса от Telegram
    const { body } = request

    // Проверяем, что это сообщение
    if (body.message) {
      const {
        chat: { id },
        text,
      } = body.message

      // Обработка команды /q для случайного вопроса
      if (text === '/q') {
        const randomIndex = Math.floor(Math.random() * questions.length)
        const question = questions[randomIndex]
        // Форматирование сообщения с жирным шрифтом для вопроса
        const message = `Ваш вопрос: *${question}* 👋🏻`
        // Отправляем сообщение обратно
        await bot.sendMessage(id, message, { parse_mode: 'Markdown' })
      }
      // Блок else удален
    }
  } catch (error) {
    // Логируем ошибки в консоль Vercel
    console.error('Error sending message')
    console.log(error.toString())
  }

  // Подтверждаем получение сообщения Telegram
  response.send('OK')
}
