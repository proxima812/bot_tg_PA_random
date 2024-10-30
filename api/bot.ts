require("dotenv").config()
import { Bot, InlineKeyboard, webhookCallback } from "grammy"

const questions = require("../handlers/questions.js")
const ideasWithEmojis = require("../handlers/ideasWithEmojis.js")
const setMood = require("../handlers/setMood.js")
const quotes = require("../handlers/quotes.js")
const js = require("../handlers/js.js")
const bk = require("../handlers/bk.js")
const tr = require("../handlers/tr.js")

// Определяем массив традиций
const traditions = [
	"Традиция 1",
	"Традиция 2",
	"Традиция 3",
	"Традиция 4",
	"Традиция 5",
	"Традиция 6",
	"Традиция 7",
	"Традиция 8",
	"Традиция 9",
	"Традиция 10",
	"Традиция 11",
	"Традиция 12",
]

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
    const chatId = ctx.chat.id;
    const commandsList = ["/bk", "/q", "/tr", "/js", "/idea", "/set", "/b"]; // Список команд для удаления

    // Проверяем, существует ли сообщение и текст сообщения
    if (ctx.message && ctx.message.text) {
        const text = ctx.message.text;

        // Проверяем, начинается ли сообщение с одной из команд в списке
        if (commandsList.some(command => text.startsWith(command))) {
            try {
                await ctx.api.deleteMessage(chatId, ctx.message.message_id); // Удаляем сообщение
            } catch (error) {
                console.error("Error deleting command message:", error.toString()); // Логируем ошибку
            }
        }
    }
}

// Объект с командами
const commands = {
	"/q": async (ctx, mention) => {
		const question = questions[Math.floor(Math.random() * questions.length)]
		await sendMessage(ctx, `(команда /q)🎁 Рандомная тема для ${mention}:\n\n<b>${question}</b>`)
	},
	"/idea": async (ctx, mention) => {
		const idea = ideasWithEmojis[Math.floor(Math.random() * ideasWithEmojis.length)]
		await sendMessage(ctx, `(команда /idea)💡 ${mention}, для вас нашлась идея:\n\n<b>${idea}</b>`)
	},
	"/set": async (ctx, mention) => {
		const mood = setMood[Math.floor(Math.random() * setMood.length)]
		await sendMessage(ctx, `(команда /set)👤 ${mention}, ваша установка на день:\n\n<b>${mood}</b>`)
	},
	"/js": async (ctx, mention) => {
		const mood = js[Math.floor(Math.random() * js.length)]
		await sendMessage(
			ctx,
			`(команда /js)😂 ${mention}, великая цитата:\n\n<b>${mood}</b> \n\n<i>-Джейсон Стетхем</i>`,
		)
	},
	"/bk": async (ctx, mention) => {
		const mood = bk[Math.floor(Math.random() * bk.length)]
		await sendMessage(ctx, `(команда /bk)👤 ${mention}, адаптация:\n\n<b>${mood}</b> \n\n<i>-БКАА</i>`)
	},
	// "/tr": async ctx => {
	// 	const mood = tr[Math.floor(Math.random() * tr.length)]
	// 	await sendMessage(
	// 		ctx,
	// 		`Случайная Традиция для изучения:\n\n${mood} \n\n<i>-Традиции АПРО</i>`,
	// 	)
	// },
	// Обновленный обработчик для команды /tr
	// "/tr": async ctx => {
	// 	// Создаем клавиатуру
	// 	const inlineKeyboard = new InlineKeyboard()

	// 	// Добавляем кнопки в две колонки
	// 	traditions.forEach((tradition, index) => {
	// 		inlineKeyboard.add({ text: tradition, callback_data: `tradition_${index}` })

	// 		// Добавляем дополнительный ряд каждые 2 кнопки
	// 		if ((index + 1) % 2 === 0) {
	// 			inlineKeyboard.row() // Создает новый ряд после каждой второй кнопки
	// 		}
	// 	})

	// 	await ctx.reply("Выберите традицию для изучения:", { reply_markup: inlineKeyboard })
	// },
	"/b": async (ctx, mention) => {
		const quote = quotes[Math.floor(Math.random() * quotes.length)]
		await sendMessage(
			ctx,
			`(команда /b)${mention}, одна из цитат:\n\n<b>${quote}</b> \n\n<i>-Конфуций</i>`,
		)
	},
}

// Обработка нажатий на кнопки
bot.on("callback_query:data", async ctx => {
	const callbackData = ctx.callbackQuery.data

	if (callbackData.startsWith("tradition_")) {
		const index = parseInt(callbackData.split("_")[1]) // Извлекаем индекс традиции

		// Получаем текст описания традиции по индексу
		const traditionText = tr[index]

		await ctx.answerCallbackQuery() // Подтверждаем нажатие

		await sendMessage(ctx, traditionText) // Отправляем текст традиции
	}
})

// Обработка сообщений
bot.on("message", async ctx => {
	const text = ctx.message.text.toLowerCase()
	const firstName = ctx.from.first_name
	const mention = ctx.from.username
		? `@${ctx.from.username}`
		: `<a href="tg://user?id=${ctx.from.id}">${firstName}</a>` // Используем HTML-ссылку для упоминания пользователя

	// Массив с ключевыми фразами и ответами в HTML формате
	const responses = {
		собрания: `${mention}, вы спрашиваете о "<b>собрания</b>"?\n<a href="https://t.me/community_pa/3384">Расписание собраний</a>`,
		"когда группа": `${mention}, вы спрашиваете "<b>когда группа</b>"?\n<a href="https://t.me/community_pa/3384">Расписание собраний</a>`,
		"когда группа?": `${mention}, вы спрашиваете "<b>когда группа?</b>"?\n<a href="https://t.me/ community_pa/3384">Расписание собраний</a>`,
		"когда собрание?": `${mention}, вы спрашиваете "<b>когда собрание?</b>"?\n<a href="https://t.me/community_pa/3384">Расписание собраний</a>`,
		"когда собрание": `${mention}, вы спрашиваете "<b>когда собрание</b>"?\n<a href="https://t.me/community_pa/3384">Расписание собраний</a>`,
		"когда встреча?": `${mention}, вы спрашиваете "<b>когда встреча?</b>"?\n<a href="https://t.me/community_pa/3384">Расписание собраний</a>`,
		расписание: `${mention}, вы спрашиваете о "<b>расписание</b>"?\n<a href="https://t.me/community_pa/3384">Расписание собраний</a>`,
		"когда след группа?": `${mention}, вы спрашиваете "<b>когда след группа?</b>"?\n<a href="https://t.me/community_pa/3384">Расписание собраний</a>`,
		рассписанию: `${mention}, вы спрашиваете "<b>рассписанию</b>"?\n<a href="https://t.me/community_pa/3384">Расписание собраний</a>`,
	}

	// Проверяем наличие ключевых фраз и отвечаем соответствующим образом
	for (const keyword in responses) {
		if (text.includes(keyword)) {
			await sendMessage(ctx, responses[keyword])
			return // Выходим после первого совпадения
		}
	}

	// Удаление команды
	await deletePreviousMessages(ctx)

	// Выполнение команды, если она существует в объекте
	if (commands[text]) {
		await commands[text](ctx, mention)
	}
})

export default webhookCallback(bot, "http")
