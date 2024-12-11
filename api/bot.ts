require("dotenv").config()
import { createClient } from "@supabase/supabase-js"
import { Bot, InlineKeyboard, webhookCallback } from "grammy"
const questions = require("../handlers/questions.js")
const ideasWithEmojis = require("../handlers/ideasWithEmojis.js")
const setMood = require("../handlers/setMood.js")
const quotes = require("../handlers/quotes.js")
const js = require("../handlers/js.js")
const bk = require("../handlers/bk.js")

const supabase = createClient(
	"https://fkwivycaacgpuwfvozlp.supabase.co", // URL вашего проекта Supabase
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrd2l2eWNhYWNncHV3ZnZvemxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDc4MTEsImV4cCI6MjA0OTQ4MzgxMX0.44dYay0RWos4tqwuj6H-ylqN4TrAIabeQLNzBn6Xuy0", // Ваш ключ API Supabase
)

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

// Функция для выбора случайного вопроса
const getRandomQuestion = () => {
	return questions[Math.floor(Math.random() * questions.length)]
}

// Объект с командами
const commands = {
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

	"/b": async (ctx, mention) => {
		const quote = quotes[Math.floor(Math.random() * quotes.length)]
		await sendMessage(
			ctx,
			`(команда /b)\n🗣 ${mention}, одна из цитат:\n\n<b>${quote}</b> \n\n<i>-Конфуций</i>`,
		)
	},
}

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
	const { data, error } = await supabase
		.from("posts")
		.select("id, desc")
		.eq("userId", userId)

	if (error) {
		console.error("Ошибка при получении карточек:", error)
		return []
	}
	return data || []
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

// Обработчик команды /start
bot.command("start", async ctx => {
	const userId = ctx.from.id

	// Создаем клавиатуру
	const keyboard = new InlineKeyboard()

	// Добавляем кнопку "Добавить карточку"
	keyboard.text("Добавить карточку", "add_card")
	keyboard.row()

	// Добавляем кнопку "Посмотреть свои карточки"
	keyboard.text("Посмотреть свои карточки", "view_cards")
	keyboard.row()

	// Отправляем сообщение с клавиатурой
	await ctx.reply("Выберите действие:", {
		reply_markup: keyboard, // Передаем клавиатуру
	})
})

// Обработчик нажатия на кнопку
bot.on("callback_query", async (ctx) => {
  try {
    const data = ctx.callbackQuery.data;

    if (data === "add_card") {
      // Ответ на запрос
      await ctx.answerCallbackQuery();
      await ctx.reply(
        "Чтобы добавить карточку, напишите команду:\n`/add_card https://t.me/КАНАЛ/НОМЕР_ПОСТА`",
        { parse_mode: "Markdown" }
      );
    } else if (data === "view_cards") {
      const userId = ctx.from.id;

      // Получаем карточки пользователя из Supabase
      const cards = await getUserCards(userId);

      // Если у пользователя нет карточек
      if (cards.length === 0) {
        await ctx.answerCallbackQuery();
        await ctx.reply("У вас нет карточек.");
        return;
      }

      // Создаем клавиатуру для отображения карточек
      const keyboard = new InlineKeyboard();
      cards.forEach((card) => {
        // Сокращаем текст карточки, если он слишком длинный
        const shortDesc = card.desc.length > 30 ? `${card.desc.slice(0, 30)}...` : card.desc;
        keyboard.text(`Карточка ${card.id}: ${shortDesc}`, `view_card_${card.id}`).row();
        keyboard.text("🗑 Удалить", `delete_card_${card.id}`).row();
      });

      // Отправляем сообщение с клавиатурой
      await ctx.answerCallbackQuery();
      await ctx.reply("Ваши карточки:", {
        reply_markup: keyboard, // Передаем клавиатуру с карточками
      });
    } else if (data.startsWith("delete_card_")) {
      // Обработка кнопки удаления
      const cardId = data.replace("delete_card_", ""); // Извлекаем ID карточки

      // Удаляем карточку из базы данных
      const { error } = await supabase.from("posts").delete().eq("id", cardId);

      if (error) {
        console.error("Ошибка при удалении карточки:", error);
        await ctx.answerCallbackQuery({ text: "Ошибка при удалении карточки." });
        return;
      }

      // Успешное удаление
      await ctx.answerCallbackQuery({ text: "Карточка успешно удалена." });
      await ctx.reply(`Карточка с ID ${cardId} была удалена.`);
    } else {
      // Обработка неизвестных запросов
      await ctx.answerCallbackQuery({ text: "Неизвестная команда." });
    }
  } catch (error) {
    console.error("Ошибка в обработке callback_query:", error);
    try {
      await ctx.answerCallbackQuery({ text: "Произошла ошибка. Попробуйте позже." });
    } catch (e) {
      console.error("Ошибка при ответе на callback_query:", e);
    }
  }
});


// Обработчик нажатия на кнопки удаления
bot.callbackQuery(/delete_card_(\d+)/, async ctx => {
	const userId = ctx.from.id
	const cardId = ctx.match[1]

	// Проверка, что карточка принадлежит текущему пользователю
	const cards = await getUserCards(userId)

	const card = cards.find(card => card.id.toString() === cardId.toString())

	if (!card) {
		await ctx.answerCallbackQuery("Эта карточка не принадлежит вам.")
		return
	}

	// Удаление карточки
	const success = await deleteCard(cardId)

	if (success) {
		await ctx.answerCallbackQuery("Карточка успешно удалена!")
		await ctx.editMessageText(`Карточка ${cardId} была удалена.`)
	} else {
		await ctx.answerCallbackQuery("Произошла ошибка при удалении карточки.")
	}
})

// Обработчик нажатия на кнопку "Посмотреть карточку"
bot.callbackQuery(/view_card_(\d+)/, async ctx => {
	const cardId = ctx.match[1]

	// Получаем информацию о карточке
	const { data, error } = await supabase
		.from("posts")
		.select("*")
		.eq("id", cardId)
		.single() // Получаем карточку с конкретным id

	if (error || !data) {
		await ctx.answerCallbackQuery("Карточка не найдена.")
		return
	}

	await ctx.answerCallbackQuery() // Отвечаем на запрос (удаляем загрузочный индикатор)
	await ctx.reply(`Карточка ${data.id}:\n${data.desc}`)
})

// Обработчик команды /add_card
bot.on("message:text", async ctx => {
	// Проверка, что сообщение начинается с команды /add_card
	if (!ctx.message.text.startsWith("/add_card")) {
		return // Прерываем выполнение, если не команда /add_card
	}

	// Убираем команду из текста и извлекаем URL
	const userMessage = ctx.message.text.replace("/add_card", "").trim() // Убираем команду /add_card из текста

	// Проверка формата сообщения с помощью регулярного выражения
	const regex = /^https:\/\/t\.me\/([a-zA-Z0-9_]+)\/(\d+)$/ // Паттерн для проверки формата https://t.me/КАНАЛ/НОМЕР
	const match = userMessage.match(regex)

	if (!match) {
		// Если формат не совпадает, отправляем сообщение об ошибке
		ctx.reply(
			"Неверный формат сообщения. Пожалуйста, используйте формат: https://t.me/КАНАЛ/НОМЕР. Например: https://t.me/trust_unity/8",
		)
		return
	}

	const userId = ctx.message.from.id // ID пользователя

	try {
		// Вставка данных в Supabase
		const { data, error } = await supabase
			.from("posts") // Убедитесь, что у вас есть таблица 'posts'
			.insert([
				{
					desc: userMessage, // Сообщение пользователя (ссылка)
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
