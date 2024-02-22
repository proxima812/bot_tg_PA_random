// https://github.com/yagop/node-telegram-bot-api/issues/319#issuecomment-324963294
// Fixes an error with Promise cancellation
process.env.NTBA_FIX_319 = "test"
const TOKEN = process.env.API_TOKEN
const TelegramBot = require("node-telegram-bot-api")

const questions = require("./questions.js")
const ideasWithEmojis = require("./ideasWithEmojis.js")
const setMood = require("./setMood.js")
const quotes = require("./quotes.js")

// Подключаем библиотеку Telegram Bot API
const bot = new TelegramBot(TOKEN)

let messageIds = new Map()

const deletePreviousMessages = async chatId => {
	if (messageIds.has(chatId)) {
		for (let messageId of messageIds.get(chatId)) {
			try {
				await bot.deleteMessage(chatId, messageId)
			} catch (error) {
				console.error("Error deleting message", error.toString())
			}
		}
		messageIds.set(chatId, [])
	}
}

const sendMessage = async (chatId, text, options = {}) => {
	try {
		const { message_id } = await bot.sendMessage(chatId, text, options)
		if (!messageIds.has(chatId)) {
			messageIds.set(chatId, [message_id])
		} else {
			messageIds.get(chatId).push(message_id)
		}
	} catch (error) {
		console.error("Error sending message", error.toString())
	}
}

bot.on("message", async msg => {
	const chatId = msg.chat.id
	const text = msg.text
	const username = msg.from.first_name

	await deletePreviousMessages(chatId)

	switch (text) {
		case "/q":
			const question = questions[Math.floor(Math.random() * questions.length)]
			await sendMessage(chatId, `🎁 Рандомная тема:\n\n*${question}*`, {
				parse_mode: "Markdown",
			})
			break
		case "/idea":
			const idea = ideasWithEmojis[Math.floor(Math.random() * ideasWithEmojis.length)]
			await sendMessage(
				chatId,
				`*${username}!*\n\n💡 Для вас нашлась идея:\n\n*${idea}*`,
				{ parse_mode: "Markdown" },
			)
			break
		case "/set":
			const mood = setMood[Math.floor(Math.random() * setMood.length)]
			await sendMessage(
				chatId,
				`*${username}!*\n\n👤 Ваша установка на день:\n\n*${mood}*`,
				{ parse_mode: "Markdown" },
			)
			break
		case "/b":
			const quote = quotes[Math.floor(Math.random() * quotes.length)]
			await sendMessage(
				chatId,
				`*${username}!*\n\n🙌 Вам важно прочитать это сегодня:\n\n*${quote}*`,
				{ parse_mode: "Markdown" },
			)
			break
		// Добавьте больше команд по аналогии
		default:
			// Обработка неизвестных команд
			await sendMessage(chatId, "Извините, я не понимаю эту команду.")
	}
})
