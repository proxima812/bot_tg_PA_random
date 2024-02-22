require("dotenv").config()
import { Bot, webhookCallback } from "grammy"
const token = process.env.TOKEN
if (!token) throw new Error("TOKEN is unset")

const bot = new Bot(token)

// Отвечает "Привет!" на команду /start
bot.command("start", async ctx => {
	await ctx.reply("Привет!")
})

export default webhookCallback(bot, "http")
