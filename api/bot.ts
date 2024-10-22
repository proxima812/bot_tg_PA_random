require("dotenv").config()
import { Bot, webhookCallback } from "grammy"

const questions = require("../handlers/questions.js")
const ideasWithEmojis = require("../handlers/ideasWithEmojis.js")
const setMood = require("../handlers/setMood.js")
const quotes = require("../handlers/quotes.js")

const token = process.env.TOKEN
if (!token) throw new Error("TOKEN is unset")

const bot = new Bot(token)

let messageIds = new Map() // Для хранения сообщений

// Функция для экранирования специальных символов Markdown
const escapeMarkdown = text => {
	return text
		.replace(/_/g, "\\_")
		.replace(/\*/g, "\\*")
		.replace(/\[/g, "\\[")
		.replace(/\]/g, "\\]")
		.replace(/\(/g, "\\(")
		.replace(/\)/g, "\\)")
		.replace(/~/g, "\\~")
		.replace(/`/g, "\\`")
		.replace(/>/g, "\\>")
		.replace(/#/g, "\\#")
		.replace(/\+/g, "\\+")
		.replace(/-/g, "\\-")
		.replace(/=/g, "\\=")
		.replace(/\|/g, "\\|")
		.replace(/\./g, "\\.")
		.replace(/!/g, "\\!")
}

// Функция для отправки сообщений
const sendMessage = async (ctx, text, options = {}) => {
	try {
		// Экранируем текст перед отправкой
		const escapedText = escapeMarkdown(text)
		const message = await ctx.reply(escapedText, { ...options, parse_mode: "Markdown" })
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
			await ctx.api.deleteMessage(chatId, ctx.message.message_id)
		} catch (error) {
			console.error("Error deleting command message:", error.toString())
		}
	}
}

// Объект с командами
const commands = {
	"/q": async (ctx, mention) => {
		const question = questions[Math.floor(Math.random() * questions.length)]
		await sendMessage(ctx, `🎁 Рандомная тема для ${mention}:\n\n*${question}*`)
	},
	"/idea": async (ctx, mention) => {
		const idea = ideasWithEmojis[Math.floor(Math.random() * ideasWithEmojis.length)]
		await sendMessage(ctx, `💡 ${mention}, для вас нашлась идея:\n\n*${idea}*`)
	},
	"/set": async (ctx, mention) => {
		const mood = setMood[Math.floor(Math.random() * setMood.length)]
		await sendMessage(ctx, `👤 ${mention}, ваша установка на день:\n\n*${mood}*`)
	},
	"/b": async (ctx, mention) => {
		const quote = quotes[Math.floor(Math.random() * quotes.length)]
		await sendMessage(ctx, `${mention}, одна из цитат:\n\n*${quote}* \n\n_-Конфуций_`)
	},
}

// Обработка сообщений
bot.on("message", async ctx => {
	const text = ctx.message.text
	const firstName = ctx.from.first_name
	const mention = ctx.from.username
		? `@${ctx.from.username}`
		: `[${firstName}](tg://user?id=${ctx.from.id})`

	// Удаление команды
	await deletePreviousMessages(ctx)

	// Выполнение команды, если она существует в объекте
	if (commands[text]) {
		await commands[text](ctx, mention)
	} else {
		await sendMessage(ctx, `Извините, ${mention}, я не понимаю эту команду.`)
	}
})

export default webhookCallback(bot, "http")
