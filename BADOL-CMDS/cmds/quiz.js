// ✅ BADOL QUIZ V8.1 - FIXED NO ANSWER REVEAL ON WRONG
const fs = require("fs");
const path = require("path");

if (!global.quizActive) global.quizActive = new Map();
if (!global.quizTimeout) global.quizTimeout = new Map();
if (!global.badol) global.badol = {};
if (!global.badol.onReply) global.badol.onReply = new Map();
if (!global.badol.onCallback) global.badol.onCallback = new Map();

const JSON_PATH = path.join(__dirname, "BADOL", "quiz.json");

function getQuiz() {
    if (!fs.existsSync(JSON_PATH)) return null;
    const db = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
    const q = db[Math.floor(Math.random() * db.length)];
    let options = [...q.options].sort(() => Math.random() - 0.5);
    let correctLetter = "";
    const letters = ["A","B","C","D"];
    options.forEach((opt,i)=>{ if(opt===q.correct) correctLetter = letters[i]; });
    return { q, options, correctLetter };
}

module.exports = {
    config: {
        name: "quiz",
        aliases: ["q"],
        version: "8.1-FIXED",
        author: "MOHAMMAD BADOL",
        role: 0,
        category: "Games",
        prefix: true,
        cooldown: 3
    },

    BADOL: async function ({ api, chatId, event }) {
        const threadID = chatId;
        const senderID = event.from?.id;
        if (global.quizTimeout.has(threadID)) { clearTimeout(global.quizTimeout.get(threadID)); global.quizTimeout.delete(threadID); }

        const data = getQuiz();
        if (!data) return api.sendMessage(chatId, `❌ quiz.json not found! Path: BADOL/quiz.json`);
        const { q, options, correctLetter } = data;

        const text =
`╭─❖─〔 🧠 EREN-AI QUIZ 〕─❖─╮
│ ❓ ${q.question}
│
├─ OPTIONS ─┤
│ 🇦 ${options[0]}
│ 🇧 ${options[1]}
│ 🇨 ${options[2]}
│ 🇩 ${options[3]}
│
│ ⏳ 120s | Press Button
╰─❖─〔 EREN-AI 〕─❖─╯`;

        const kb = {
            inline_keyboard: [
                [{ text: `🇦 ${options[0].slice(0,18)}`, callback_data: `quiz_A` }, { text: `🇧 ${options[1].slice(0,18)}`, callback_data: `quiz_B` }],
                [{ text: `🇨 ${options[2].slice(0,18)}`, callback_data: `quiz_C` }, { text: `🇩 ${options[3].slice(0,18)}`, callback_data: `quiz_D` }],
                [{ text: `⏭️ Skip`, callback_data: `quiz_skip` }, { text: `📊 Help`, callback_data: `quiz_help` }]
            ]
        };

        const sent = await api.sendMessage(chatId, text, { reply_markup: kb });
        global.quizActive.set(threadID, { correctLetter, correctAnswer: q.correct, question: q.question, options, msgId: sent.message_id });
        global.badol.onReply.set(sent.message_id, { commandName: "quiz", author: senderID });
        global.badol.onCallback.set(sent.message_id, { commandName: "quiz" });

        const timer = setTimeout(async () => {
            if (global.quizActive.has(threadID)) {
                const s = global.quizActive.get(threadID);
                const timeoutText =
`╭─❖─〔 ⏰ TIME OUT! 〕─❖─╮
│ ❌ কেউ উত্তর দিতে পারেনি!
│ ❓ ${s.question}
│ 🎯 সঠিক: ${s.correctAnswer} (${s.correctLetter})
╰─❖─〔 EREN-AI 〕─❖─╯`;
                try { await api.editMessageText(timeoutText, { chat_id: threadID, message_id: s.msgId, reply_markup: { inline_keyboard: [[{ text: `🎮 New Quiz`, callback_data: `quiz_next` }]] } }); } catch { await api.sendMessage(threadID, timeoutText); }
                global.quizActive.delete(threadID);
                global.quizTimeout.delete(threadID);
            }
        }, 120000);
        global.quizTimeout.set(threadID, timer);
    },

    onReply: async function({ event, api, chatId }) {
        const choice = (event.text||"").trim().toUpperCase();
        if(!["A","B","C","D"].includes(choice)) return;
        return handle(api, chatId, event.from, choice);
    },

    onCallback: async function({ event, api, ctx }) {
        const data = event.data;
        const chatId = event.message.chat.id;
        const msgId = event.message.message_id;
        try { await ctx.answerCbQuery(); } catch {}
        if(data==="quiz_help"){ try { await ctx.answerCbQuery(`Button চাপুন! 120s সময়! ভুল দিলে উত্তর দেখাবে না!`, { show_alert: true }); } catch {} return; }
        if(data==="quiz_skip"){
            if(global.quizTimeout.has(chatId)) { clearTimeout(global.quizTimeout.get(chatId)); global.quizTimeout.delete(chatId); }
            const s = global.quizActive.get(chatId);
            if(!s) return;
            const skipText = `╭─❖─〔 ⏭️ SKIPPED 〕─❖─╮\n│ ❓ ${s.question}\n│ 🎯 উত্তর ছিল: ${s.correctAnswer} (${s.correctLetter})\n╰─❖─〔 EREN-AI 〕─❖─╯`;
            try { await ctx.editMessageText(skipText, { reply_markup: { inline_keyboard: [[{ text: `🎮 New Quiz`, callback_data: `quiz_next` }]] } }); } catch {}
            global.quizActive.delete(chatId);
            return;
        }
        if(data==="quiz_next"){
            if(global.quizTimeout.has(chatId)) { clearTimeout(global.quizTimeout.get(chatId)); global.quizTimeout.delete(chatId); }
            const d = getQuiz();
            const { q, options, correctLetter } = d;
            const text = `╭─❖─〔 🧠 EREN-AI QUIZ 〕─❖─╮\n│ ❓ ${q.question}\n│ 🇦 ${options[0]}\n│ 🇧 ${options[1]}\n│ 🇨 ${options[2]}\n│ 🇩 ${options[3]}\n╰─❖─〔 120s 〕─❖─╯`;
            const kb = { inline_keyboard: [[{ text: `🇦 ${options[0].slice(0,18)}`, callback_data: `quiz_A` }, { text: `🇧 ${options[1].slice(0,18)}`, callback_data: `quiz_B` }],[{ text: `🇨 ${options[2].slice(0,18)}`, callback_data: `quiz_C` }, { text: `🇩 ${options[3].slice(0,18)}`, callback_data: `quiz_D` }],[{ text: `⏭️ Skip`, callback_data: `quiz_skip` }]] };
            global.quizActive.set(chatId, { correctLetter, correctAnswer: q.correct, question: q.question, options, msgId });
            global.badol.onCallback.set(msgId, { commandName: "quiz" });
            try { await ctx.editMessageText(text, { reply_markup: kb }); } catch {}
            const timer = setTimeout(async () => {
                if(global.quizActive.has(chatId)){
                    const s = global.quizActive.get(chatId);
                    const t = `╭─❖─〔 ⏰ TIME OUT! 〕─❖─╮\n│ ❓ ${s.question}\n│ 🎯 সঠিক: ${s.correctAnswer} (${s.correctLetter})\n╰─❖─〔 〕─❖─╯`;
                    try { await api.editMessageText(t, { chat_id: chatId, message_id: msgId, reply_markup: { inline_keyboard: [[{ text: `🎮 New Quiz`, callback_data: `quiz_next` }]] } }); } catch {}
                    global.quizActive.delete(chatId);
                }
            }, 120000);
            global.quizTimeout.set(chatId, timer);
            return;
        }
        const choice = data.replace("quiz_","");
        return handle(api, chatId, event.from, choice, ctx);
    }
};

async function handle(api, chatId, user, choice, ctx=null){
    const s = global.quizActive.get(chatId);
    if(!s) { if(ctx) try { await ctx.answerCbQuery("❌ Expired! /quiz", { show_alert: true }); } catch {} return; }
    const name = user.first_name || "User";

    if(choice===s.correctLetter){
        if(global.quizTimeout.has(chatId)) { clearTimeout(global.quizTimeout.get(chatId)); global.quizTimeout.delete(chatId); }
        global.quizActive.delete(chatId);
        const win = `╭─❖─〔 🎉 WINNER! 〕─❖─╮\n│ 👑 ${name}\n│ ✅ ${s.correctAnswer} (${s.correctLetter})\n│ ❓ ${s.question}\n│ 🎯 তোমার উত্তর: ${choice} 100% সঠিক\n╰─❖─〔 EREN-AI 〕─❖─╯`;
        const kb = { inline_keyboard: [[{ text: `🎮 Play Again`, callback_data: `quiz_next` }]] };
        if(ctx){ try { await ctx.editMessageText(win, { reply_markup: kb }); } catch { await api.sendMessage(chatId, win, { reply_markup: kb }); } }
        else await api.sendMessage(chatId, win, { reply_markup: kb });
    } else {
        const wrong = `╭─❖─〔 ❌ WRONG! 〕─❖─╮\n│ 👤 ${name}\n│ ❌ তোমার উত্তর: ${choice} - ভুল!\n│ 💡 আবার চেষ্টা করো!\n│ ❓ ${s.question}\n╰─❖─〔 TRY AGAIN 〕─❖─╯`;
        const kb = { inline_keyboard: [[{ text: `🇦 ${s.options[0].slice(0,15)}`, callback_data: `quiz_A` }, { text: `🇧 ${s.options[1].slice(0,15)}`, callback_data: `quiz_B` }],[{ text: `🇨 ${s.options[2].slice(0,15)}`, callback_data: `quiz_C` }, { text: `🇩 ${s.options[3].slice(0,15)}`, callback_data: `quiz_D` }],[{ text: `⏭️ Skip`, callback_data: `quiz_skip` }]] };
        if(ctx){
            try { await ctx.answerCbQuery(`❌ ভুল! আবার চেষ্টা করো!`, { show_alert: false }); } catch {}
            try { await ctx.editMessageText(wrong, { reply_markup: kb }); } catch {}
            setTimeout(async()=>{
                const still = global.quizActive.get(chatId);
                if(still){
                    const back = `╭─❖─〔 🧠 EREN-AI QUIZ 〕─❖─╮\n│ ❓ ${still.question}\n│ 🇦 ${still.options[0]}\n│ 🇧 ${still.options[1]}\n│ 🇨 ${still.options[2]}\n│ 🇩 ${still.options[3]}\n│ 💬 Last: ${name} Wrong (${choice})\n╰─❖─〔 GUESS AGAIN 〕─❖─╯`;
                    const kb2 = { inline_keyboard: [[{ text: `🇦`, callback_data: `quiz_A` }, { text: `🇧`, callback_data: `quiz_B` }, { text: `🇨`, callback_data: `quiz_C` }, { text: `🇩`, callback_data: `quiz_D` }]] };
                    try { await api.editMessageText(back, { chat_id: chatId, message_id: still.msgId, reply_markup: kb2 }); } catch {}
                }
            }, 2000);
        } else {
            await api.sendMessage(chatId, `❌ ${name} ভুল! আবার চেষ্টা করো!`);
        }
    }
}