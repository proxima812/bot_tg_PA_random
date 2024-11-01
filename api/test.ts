require("dotenv").config()
import axios from "axios"
import dotenv from "dotenv"
import { Bot, InlineKeyboard, webhookCallback } from "grammy"

dotenv.config()

const token = "6662031438:AAGf6QtYKRJVq6NhLRkASWphX7mU1RSBBq0"
if (!token) throw new Error("BOT_TOKEN is unset")
const bot = new Bot('token')

async function getMarkdownFiles() {
	const response = await axios.get(
		`https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/src/content/posts`,
		{
			headers: {
				Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
				Accept: "application/vnd.github.v3+json",
			},
		},
	)
	return response.data.filter(file => file.name.endsWith(".md"))
}

// Пример команды
bot.command("start", ctx => ctx.reply("Привет! Я бот."))


// Команда для отображения списка постов
bot.command("posts", async ctx => {
	const files = await getMarkdownFiles()
	const keyboard = new InlineKeyboard()

	files.forEach(file => keyboard.text(file.name, file.name).row())

	await ctx.reply("Посты сайта АП:", { reply_markup: keyboard })
})


bot.start()
