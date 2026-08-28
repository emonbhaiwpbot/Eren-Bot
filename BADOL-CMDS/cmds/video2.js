// ✅ BADOL V10 - VIDEO2 - INBOX UNLOCK, GROUP LOCK
const fs = require("fs");
const path = require("path");
const axios = require("axios");

if (!global.usedVideos) global.usedVideos = new Map();
if (!global.badol) global.badol = {};
if (!global.badol.onReply) global.badol.onReply = new Map();
if (!global.badol.onCallback) global.badol.onCallback = new Map();

const DATA_PATH = path.join(__dirname, "BADOL", "videoList.json");
const OWNER_ID = 6954597258;

const LOCKED_NAMES = ["hot", "copex", "item"];

function isLocked(key, index){
  const k = key.toLowerCase();
  return LOCKED_NAMES.includes(k) || index === 5 || index === 6;
}

function isPrivateChat(chatId){
  return String(chatId).startsWith("-") === false;
}

async function sendVideo(api, chatId, userId, index, isPrivate) {
    const videosJson = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    const keys = Object.keys(videosJson);
    const key = keys[index];
    const list = videosJson[key];
    if (!global.usedVideos.has(userId)) global.usedVideos.set(userId, []);
    let available = list.filter(v =>!global.usedVideos.get(userId).includes(v));
    if (available.length === 0) { global.usedVideos.set(userId, []); available = list; }
    const url = available[Math.floor(Math.random() * available.length)];
    global.usedVideos.get(userId).push(url);
    const wait = await api.sendMessage(chatId, `⏳ Downloading ${key.toUpperCase()}... [${available.length} left]`);
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000, headers: { 'User-Agent': 'Mozilla/5.0' }, maxRedirects: 5 });
        const tmp = path.join(__dirname, "BADOL", `v2_${Date.now()}_${userId}.mp4`);
        fs.writeFileSync(tmp, Buffer.from(res.data));
        if (fs.statSync(tmp).size < 1000) throw new Error("Drive link expired");
        await api.sendVideo(chatId, { source: fs.createReadStream(tmp) }, {
            caption: `🎬 ${key.toUpperCase()} | Left: ${available.length - 1} ${isPrivate? '| INBOX UNLOCK 🔓' : ''}\n🤖 EREN-AI-BOT`,
            reply_markup: { inline_keyboard: [[{ text: `🔄 Next ${key.toUpperCase()}`, callback_data: `video2_next_${index}` }],[{ text: `📜 Menu`, callback_data: `video2_menu` }]] }
        });
        fs.unlinkSync(tmp);
        try { await api.deleteMessage(chatId, wait.message_id); } catch {}
    } catch (e) {
        try { await api.deleteMessage(chatId, wait.message_id); } catch {}
        const arr = global.usedVideos.get(userId);
        const idx = arr.indexOf(url);
        if (idx > -1) arr.splice(idx, 1);
        await api.sendMessage(chatId, `❌ Failed: ${e.message}\nTry /video2 ${index+1}`);
    }
}

module.exports = {
    config: {
        name: "video2",
        version: "10.2-INBOX-UNLOCK",
        author: "MOHAMMAD BADOL",
        role: 0,
        credit: "MOHAMMAD BADOL",
        description: "Inbox unlock, Group lock",
        category: "media",
        prefix: true,
        aliases: ["v2"],
        cooldown: 3
    },
    BADOL: async function({ api, chatId, ctx, event, args }) {
        const msg = event || ctx?.message || {};
        const userId = msg.from?.id;
        const isPrivate = chatId > 0;
        if (!fs.existsSync(DATA_PATH)) return await api.sendMessage(chatId, `❌ Not found: BADOL/videoList.json`);
        const videosJson = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
        const keys = Object.keys(videosJson);
        if (args && args[0]) {
            let idx = -1;
            if (!isNaN(args[0])) idx = parseInt(args[0]) - 1;
            else idx = keys.findIndex(k => k.toLowerCase() === args[0].toLowerCase());
            if (idx >= 0 && idx < keys.length) {
                if(isLocked(keys[idx], idx) && String(userId)!== String(OWNER_ID) &&!isPrivate){
                    return await api.sendMessage(chatId, `⛔ এই ${keys[idx].toUpperCase()} ক্যাটাগরি Group এ Owner Only! 🔒\n✅ Bot এর Inbox এ গিয়ে Try কর - ওইখানে Unlock আছে! 🔓`);
                }
                return await sendVideo(api, chatId, userId, idx, isPrivate);
            }
        }
        let txt = `╭───『 VIDEO MENU 』───╮\n│ Total: ${keys.length} Category ${isPrivate? '(INBOX 🔓)' : '(GROUP 🔒)'}\n├──────────────────┤\n`;
        keys.forEach((k, i) => {
            const locked = isLocked(k,i);
            if(isPrivate) txt += `│ ${i+1}. ${k.toUpperCase()} ${locked? '🔓(Inbox Only)' : ''}\n`;
            else txt += `│ ${i+1}. ${k.toUpperCase()} ${locked? '🔒' : ''}\n`;
        });
        txt += `├──────────────────┤\n│ Reply with number\n╰──────────────────╯`;
        const buttons = [];
        keys.forEach((k, i) => {
            const btnText = isLocked(k,i)? (isPrivate? `🔓 ${i+1}. ${k.toUpperCase()}` : `🔒 ${i+1}. ${k.toUpperCase()}`) : `${i+1}. ${k.toUpperCase()}`;
            buttons.push([{ text: btnText, callback_data: `video2_${i}` }]);
        });
        const sent = await api.sendMessage(chatId, txt, { reply_markup: { inline_keyboard: buttons } });
        const msgId = sent.message_id || sent.messageId;
        global.badol.onReply.set(msgId, { commandName: "video2", author: userId, isPrivate });
        global.badol.onCallback.set(msgId, { commandName: "video2", isPrivate });
    },
    onReply: async function({ event, api, Reply, ctx, chatId }) {
        const msg = event;
        const userId = msg.from?.id;
        const targetChatId = chatId || msg.chat.id;
        const isPrivate = targetChatId > 0;
        const text = (msg.text || "").trim();
        const index = parseInt(text) - 1;
        const videosJson = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
        const keys = Object.keys(videosJson);
        if (isNaN(index) || index <0 || index >= keys.length) return await api.sendMessage(targetChatId, `❌ Number দাও!`);
        if(isLocked(keys[index], index) && String(userId)!== String(OWNER_ID) &&!isPrivate){
            return await api.sendMessage(targetChatId, `⛔ এই ${keys[index].toUpperCase()} Group এ Owner Only! 🔒\nInbox এ Try কর!`);
        }
        return await sendVideo(api, targetChatId, userId, index, isPrivate);
    },
    onCallback: async function({ event, api, ctx }) {
        const data = event.data;
        const chatId = event.message.chat.id;
        const userId = event.from.id;
        const isPrivate = chatId > 0;
        const videosJson = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
        const keys = Object.keys(videosJson);
        try { await ctx.answerCbQuery().catch(()=>{}); } catch {}
        if (data === "video2_menu") {
            let txt = `╭───『 VIDEO MENU 』───╮ ${isPrivate? '(INBOX 🔓)' : ''}\n`;
            keys.forEach((k, i) => txt += `│ ${i+1}. ${k.toUpperCase()} ${isLocked(k,i) &&!isPrivate?'🔒':''}\n`);
            txt += `╰──────────────────╯`;
            const buttons = [];
            keys.forEach((k, i) => {
                const btnText = isLocked(k,i)? (isPrivate? `🔓 ${i+1}. ${k.toUpperCase()}` : `🔒 ${i+1}. ${k.toUpperCase()}`) : `${i+1}. ${k.toUpperCase()}`;
                buttons.push([{ text: btnText, callback_data: `video2_${i}` }]);
            });
            return await api.sendMessage(chatId, txt, { reply_markup: { inline_keyboard: buttons } });
        }
        if (data.startsWith("video2_next_")) {
            const idx = parseInt(data.split("_")[2]);
            if(isLocked(keys[idx], idx) && String(userId)!== String(OWNER_ID) &&!isPrivate){
                return await api.sendMessage(chatId, `⛔ এই ${keys[idx].toUpperCase()} Group এ Owner Only! 🔒`);
            }
            return await sendVideo(api, chatId, userId, idx, isPrivate);
        }
        if (data.startsWith("video2_")) {
            const idx = parseInt(data.replace("video2_", ""));
            if (!isNaN(idx)) {
                if(isLocked(keys[idx], idx) && String(userId)!== String(OWNER_ID) &&!isPrivate) {
                    return await ctx.answerCbQuery("⛔ Group এ Owner Only! Inbox এ Try কর! 🔒", { show_alert: true }).catch(async()=>{
                        await api.sendMessage(chatId, `⛔ ${event.from.first_name}, এই ${keys[idx].toUpperCase()} Group এ Owner Only! 🔒\nBot এর Inbox এ Unlock! 🔓`);
                    });
                }
                return await sendVideo(api, chatId, userId, idx, isPrivate);
            }
        }
    }
};