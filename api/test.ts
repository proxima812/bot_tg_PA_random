import { Bot } from "grammy"

const bot = new Bot("7930164051:AAHF4GdP_jpjOiBl6ZCA1gY8HJZ-VH3A520")
bot.command("start", ctx => ctx.reply("Welcome! Up and running."))
bot.on("message", ctx => ctx.reply("Got another message!"))

bot.start()
