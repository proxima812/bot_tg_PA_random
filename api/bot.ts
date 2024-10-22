require("dotenv").config()
import { Bot, webhookCallback } from "grammy"
const fs = require("fs")

const questions = require("../handlers/questions.js")
const ideasWithEmojis = require("../handlers/ideasWithEmojis.js")
const setMood = require("../handlers/setMood.js")
const quotes = require("../handlers/quotes.js")
const js = require("../handlers/js.js")

const token = process.env.TOKEN
if (!token) throw new Error("TOKEN is unset")

const bot = new Bot(token)

let messageIds = new Map() // Для хранения сообщений

// Функция для отправки сообщений с HTML-разметкой
const sendMessage = async (ctx, text, options = {}) => {
	try {
		const message = await ctx.reply(text, { ...options, parse_mode: "HTML" }) // Используем HTML вместо Markdown
		const chatId = ctx.chat.id
		const messageId = message.message_id

		if (!messageIds.has(chatId)) {
			messageIds.set(chatId, [messageId])
		} else {
			messageIds.get(chatId).push(messageId)
		}
	} catch (error) {
		console.error("Error sending message:", error.toString())
	}
}

// Функция для удаления предыдущих сообщений (очистка чата)
const deletePreviousMessages = async ctx => {
	const chatId = ctx.chat.id
	const text = ctx.message.text

	// Проверяем, является ли сообщение командой
	if (text.startsWith("/")) {
		try {
			setTimeout(async () => {
				await ctx.api.deleteMessage(chatId, ctx.message.message_id)
			}, 5000)
		} catch (error) {
			console.error("Error deleting command message:", error.toString())
		}
	}
}


const imagePath = "../images/1.jpg"
// Объект с командами
const commands = {
	"/q": async (ctx, mention) => {
		const question = questions[Math.floor(Math.random() * questions.length)]
		await sendMessage(ctx, `🎁 Рандомная тема для ${mention}:\n\n<b>${question}</b>`)
	},
	"/idea": async (ctx, mention) => {
		const idea = ideasWithEmojis[Math.floor(Math.random() * ideasWithEmojis.length)]
		await sendMessage(ctx, `💡 ${mention}, для вас нашлась идея:\n\n<b>${idea}</b>`)
	},
	"/set": async (ctx, mention) => {
		const mood = setMood[Math.floor(Math.random() * setMood.length)]
		await sendMessage(ctx, `👤 ${mention}, ваша установка на день:\n\n<b>${mood}</b>`)
	},
	"/js": async (ctx, mention) => {
		// Случайная цитата
		const mood = js[Math.floor(Math.random() * js.length)]

		// Чтение локального файла изображения через fs
		const photoStream = fs.createReadStream(imagePath)

		// Отправляем изображение с текстом
		await ctx.api.sendPhoto(
			ctx.chat.id,
			{ source: photoStream },
			{
				caption: `👤 ${mention}, Великая цитата 😂:\n\n<b>${mood}</b>`,
				parse_mode: "HTML", // Для поддержки HTML-тегов
			},
		)
	},
	"/b": async (ctx, mention) => {
		const quote = quotes[Math.floor(Math.random() * quotes.length)]
		await sendMessage(
			ctx,
			`${mention}, одна из цитат:\n\n<b>${quote}</b> \n\n<i>-Конфуций</i>`,
		)
	},
}

// Обработка сообщений
bot.on("message", async ctx => {
	const text = ctx.message.text
	const firstName = ctx.from.first_name
	const mention = ctx.from.username
		? `@${ctx.from.username}`
		: `<a href="tg://user?id=${ctx.from.id}">${firstName}</a>` // Используем HTML-ссылку для упоминания пользователя

	// Удаление команды
	await deletePreviousMessages(ctx)

	// Выполнение команды, если она существует в объекте
	if (commands[text]) {
		await commands[text](ctx, mention)
	}
})

export default webhookCallback(bot, "http")
