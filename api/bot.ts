require("dotenv").config()
import { createClient } from "@supabase/supabase-js"
import { Bot, InlineKeyboard, webhookCallback } from "grammy"
const questions = require("../handlers/questions.js")
const ideasWithEmojis = require("../handlers/ideasWithEmojis.js")
const setMood = require("../handlers/setMood.js")
const quotes = require("../handlers/quotes.js")
const js = require("../handlers/js.js")
const bk = require("../handlers/bk.js")
const tr = require("../handlers/tr.js")

const supabase = createClient(
	"https://fkwivycaacgpuwfvozlp.supabase.co", // URL вашего проекта Supabase
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrd2l2eWNhYWNncHV3ZnZvemxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDc4MTEsImV4cCI6MjA0OTQ4MzgxMX0.44dYay0RWos4tqwuj6H-ylqN4TrAIabeQLNzBn6Xuy0", // Ваш ключ API Supabase
)

// Определяем массив традиций
// const traditions = [
// 	"Традиция 1",
// 	"Традиция 2",
// 	"Традиция 3",
// 	"Традиция 4",
// 	"Традиция 5",
// 	"Традиция 6",
// 	"Традиция 7",
// 	"Традиция 8",
// 	"Традиция 9",
// 	"Традиция 10",
// 	"Традиция 11",
// 	"Традиция 12",
// ]

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
	const commandsList = ["/bk", "/q", "/tr", "/js", "/idea", "/set", "/b"] // Список команд для удаления

	// Проверяем, существует ли сообщение и текст сообщения
	if (ctx.message && ctx.message.text) {
		const text = ctx.message.text

		// Проверяем, начинается ли сообщение с одной из команд в списке
		if (commandsList.some(command => text.startsWith(command))) {
			try {
				await ctx.api.deleteMessage(chatId, ctx.message.message_id) // Удаляем сообщение
			} catch (error) {
				console.error("Error deleting command message:", error.toString()) // Логируем ошибку
			}
		}
	}
}

// Функция для выбора случайного вопроса
const getRandomQuestion = () => {
	return questions[Math.floor(Math.random() * questions.length)]
}

// Объект с командами
const commands = {
	// "/q": async (ctx, mention) => {
	// 	const question = questions[Math.floor(Math.random() * questions.length)]
	// 	await sendMessage(
	// 		ctx,
	// 		`(команда /q)\n🎁 Рандомная тема для ${mention}:\n\n<b>${question}</b>`,
	// 	)
	// },
	"/idea": async (ctx, mention) => {
		const idea = ideasWithEmojis[Math.floor(Math.random() * ideasWithEmojis.length)]
		await sendMessage(
			ctx,
			`(команда /idea)\n💡 ${mention}, для вас нашлась идея:\n\n<b>${idea}</b>`,
		)
	},
	"/set": async (ctx, mention) => {
		const mood = setMood[Math.floor(Math.random() * setMood.length)]
		await sendMessage(
			ctx,
			`(команда /set)\n👤 ${mention}, ваша установка на день:\n\n<b>${mood}</b>`,
		)
	},
	"/js": async (ctx, mention) => {
		const mood = js[Math.floor(Math.random() * js.length)]
		await sendMessage(
			ctx,
			`(команда /js)\n😂 ${mention}, великая цитата:\n\n<b>${mood}</b> \n\n<i>-Джейсон Стетхем</i>`,
		)
	},
	"/bk": async (ctx, mention) => {
		const mood = bk[Math.floor(Math.random() * bk.length)]
		await sendMessage(
			ctx,
			`(команда /bk)\n👤 ${mention}, адаптация:\n\n<b>${mood}</b> \n\n<i>-БКАА</i>`,
		)
	},

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
			`(команда /b)\n🗣 ${mention}, одна из цитат:\n\n<b>${quote}</b> \n\n<i>-Конфуций</i>`,
		)
	},
}

// Обработка нажатий на кнопки
// bot.on("callback_query:data", async ctx => {
// 	const callbackData = ctx.callbackQuery.data

// 	if (callbackData.startsWith("tradition_")) {
// 		const index = parseInt(callbackData.split("_")[1]) // Извлекаем индекс традиции

// 		// Получаем текст описания традиции по индексу
// 		const traditionText = tr[index]

// 		await ctx.answerCallbackQuery() // Подтверждаем нажатие

// 		await sendMessage(ctx, traditionText) // Отправляем текст традиции
// 	}
// })

// Обработчик команды /q
bot.command("q", async ctx => {
	const mention = ctx.from.first_name || "пользователь" // Получаем имя пользователя
	const question = getRandomQuestion() // Получаем случайный вопрос

	// Создаем inline-клавиатуру
	const keyboard = new InlineKeyboard().text("Другой вопрос", "new_question")

	// Отправляем сообщение с кнопкой
	await ctx.reply(`🎁 Рандомная тема для ${mention}:\n\n<b>${question}</b>`, {
		parse_mode: "HTML",
		reply_markup: keyboard,
	})
})

// Обработчик callback-запроса на кнопку "Другой вопрос"
bot.callbackQuery("new_question", async ctx => {
	const newQuestion = getRandomQuestion() // Новый случайный вопрос

	try {
		// Удаляем предыдущее сообщение
		await ctx.deleteMessage()

		// Отправляем новое сообщение с кнопкой
		const keyboard = new InlineKeyboard().text("Другая тема", "new_question")
		await ctx.reply(`🎁 Новая тема:\n\n<b>${newQuestion}</b>`, {
			parse_mode: "HTML",
			reply_markup: keyboard,
		})
	} catch (error) {
		console.error("Ошибка при удалении сообщения или отправке нового", error)
	}
})

// Функция для получения карточек пользователя из Supabase
async function getUserCards(userId) {
	const { data, error } = await supabase.from("posts").select("*").eq("userId", userId) // Получаем карточки, где userId совпадает с ID текущего пользователя

	if (error) {
		console.error("Ошибка при получении карточек:", error)
		return []
	}
	return data
}

// Функция для удаления карточки из Supabase
async function deleteCard(cardId) {
	const { data, error } = await supabase.from("posts").delete().eq("id", cardId) // Удаляем карточку с соответствующим id

	if (error) {
		console.error("Ошибка при удалении карточки:", error)
		return false
	}
	return true
}

bot.command("/get_posts", async ctx => {
	const userId = ctx.from.id
	// Получаем карточки пользователя из Supabase
	const cards = await getUserCards(userId)

	if (cards.length === 0) {
		ctx.reply("У вас нет карточек.")
		return
	}

	// Создаем клавиатуру с кнопками для удаления карточек
	const keyboard = cards.map(card => [
		{
			text: `Карточка ${card.id}: ${card.desc}`,
			callback_data: `view_card_${card.id}`,
		},
		{
			text: "Удалить",
			callback_data: `delete_card_${card.id}`,
		},
	])

	// Отправляем сообщения с кнопками для каждой карточки
	ctx.reply("Ваши карточки:", {
		reply_markup: {
			inline_keyboard: keyboard,
		},
	})
})

bot.command("/get_posts", async ctx => {
	const userId = ctx.from.id
	const cardId = ctx.match[1]

	// Проверка, что карточка принадлежит текущему пользователю
	const cards = await getUserCards(userId)

	const card = cards.find(card => card.id.toString() === cardId.toString())

	if (!card) {
		ctx.reply("Эта карточка не принадлежит вам.")
		return
	}

	// Удаление карточки
	const success = await deleteCard(cardId)

	if (success) {
		ctx.reply("Карточка успешно удалена!")
	} else {
		ctx.reply("Произошла ошибка при удалении карточки.")
	}
})

bot.command("/get_posts", async ctx => {
	const cardId = ctx.match[1]

	// Получаем информацию о карточке
	const { data, error } = await supabase
		.from("posts")
		.select("*")
		.eq("id", cardId)
		.single() // Получаем карточку с конкретным id

	if (error || !data) {
		ctx.reply("Карточка не найдена.")
		return
	}

	ctx.reply(`Карточка ${data.id}:\n${data.desc}`)
})

// Обработчик сообщений
bot.on("message:text", async ctx => {
	// Проверка, что сообщение пришло в личном чате
	if (ctx.chat.type !== "private") {
		console.log("Сообщение пришло из группы, игнорируем.")
		return // Прерываем выполнение, если не личный чат
	}

	const userMessage = ctx.message.text // Текст сообщения
	const userId = ctx.message.from.id // ID пользователя

	try {
		// Вставка данных в Supabase
		const { data, error } = await supabase
			.from("posts") // Убедитесь, что у вас есть таблица 'posts'
			.insert([
				{
					desc: userMessage, // Сообщение пользователя
					userId: userId,
				},
			])

		if (error) {
			console.error("Ошибка при добавлении записи в Supabase:", error.message)
			ctx.reply("Произошла ошибка при добавлении карточки.")
			return
		}

		console.log("Карточка добавлена с сообщением:", userMessage)
		ctx.reply("Ваше сообщение было добавлено как карточка!")
	} catch (error) {
		console.error("Ошибка при работе с Supabase:", error)
		ctx.reply("Произошла ошибка при добавлении карточки.")
	}
})

// Обработка сообщений
bot.on("message", async ctx => {
	if (!ctx.message || !ctx.message.text) {
		console.log("Received a non-text message or an undefined message.")
		return // Если нет текста, выходим из функции
	}

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
	// for (const keyword in responses) {
	// 	if (text.includes(keyword)) {
	// 		await sendMessage(ctx, responses[keyword])
	// 		return // Выходим после первого совпадения
	// 	}
	// }

	// Удаление команды
	// await deletePreviousMessages(ctx)

	// Выполнение команды, если она существует в объекте
	if (commands[text]) {
		await commands[text](ctx, mention)
	}
})

export default webhookCallback(bot, "http")
