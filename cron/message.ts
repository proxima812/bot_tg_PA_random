require("dotenv").config()
import { Bot } from "grammy"
const token = process.env.TOKEN
if (!token) throw new Error("TOKEN is unset")

const chatId = -1002084678955

const bot = new Bot(token)

async function sendMessage() {
	try {
		await bot.api.sendMessage(chatId, "Тест крон задачи.")
		console.log("Сообщение успешно отправлено")
	} catch (error) {
		console.error("Ошибка при отправке сообщения:", error)
	}
}

sendMessage().then(() => process.exit(0))
