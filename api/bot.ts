require("dotenv").config()
import { Bot, webhookCallback } from "grammy"

const questions = require("../handlers/questions.js")
const ideasWithEmojis = require("../handlers/ideasWithEmojis.js")
const setMood = require("../handlers/setMood.js")
const quotes = require("../handlers/quotes.js")

const token = process.env.TOKEN
if (!token) throw new Error("TOKEN is unset")

const bot = new Bot(token)


let messageIds = new Map()

const deletePreviousMessages = async ctx => {
	const chatId = ctx.chat.id
	const currentMessageId = ctx.message.message_id // Получаем ID текущего сообщения (команды)

	// Добавляем ID текущего сообщения в массив для удаления
	if (!messageIds.has(chatId)) {
		messageIds.set(chatId, [currentMessageId])
	} else {
		let ids = messageIds.get(chatId)
		if (!ids.includes(currentMessageId)) {
			ids.push(currentMessageId)
		}
	}

	// Удаляем предыдущие сообщения
	if (messageIds.has(chatId)) {
		for (let messageId of messageIds.get(chatId)) {
			try {
				await ctx.api.deleteMessage(chatId, messageId)
			} catch (error) {
				console.error("Error deleting message", error.toString())
			}
		}
		messageIds.set(chatId, []) // Очищаем массив ID после удаления
	}
}


const sendMessage = async (ctx, text, options = {}) => {
	try {
		const message = await ctx.reply(text, options)
		const chatId = ctx.chat.id
		const messageId = message.message_id
		if (!messageIds.has(chatId)) {
			messageIds.set(chatId, [messageId])
		} else {
			messageIds.get(chatId).push(messageId)
		}
	} catch (error) {
		console.error("Error sending message", error.toString())
	}
}

bot.on("message", async ctx => {
	await deletePreviousMessages(ctx)
	const text = ctx.message.text
	const firstName = ctx.from.first_name
	const mention = ctx.from.username
		? `@${ctx.from.username}`
    : `[${firstName}](tg://user?id=${ctx.from.id})`
  

	switch (text) {
		case "/q":
			const question = questions[Math.floor(Math.random() * questions.length)]
			await sendMessage(ctx, `🎁 Рандомная тема для ${mention}:\n\n*${question}*`, {
				parse_mode: "Markdown",
			})
			break
		case "/idea":
			const idea = ideasWithEmojis[Math.floor(Math.random() * ideasWithEmojis.length)]
			await sendMessage(ctx, `💡 ${mention}, для вас нашлась идея:\n\n*${idea}*`, {
				parse_mode: "Markdown",
			})
			break
		case "/set":
			const mood = setMood[Math.floor(Math.random() * setMood.length)]
			await sendMessage(ctx, `👤 ${mention}, ваша установка на день:\n\n*${mood}*`, {
				parse_mode: "Markdown",
			})
			break
		case "/b":
			const quote = quotes[Math.floor(Math.random() * quotes.length)]
			await sendMessage(ctx, `${mention}, одна из цитат:\n\n*${quote}* \n\n_-Конфуций_`, {
				parse_mode: "Markdown",
			})
			break
		default:
			await sendMessage(ctx, `Извините, ${mention}, я не понимаю эту команду.`)
	}
})

export default webhookCallback(bot, "http")
