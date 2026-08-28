const axios = require("axios");
const memory = new Map();

function detectLang(t){ return /[\u0980-\u09FF]/.test(t) ? "bn" : "en"; }
function buildPrompt(h, lang){
  let s = lang==="bn" ? "Reply short in Bangla. Be friendly." : "Reply short in English. Be friendly.";
  return s + "\n\n" + h.map(x=>`${x.role==="user"?"User":"Assistant"}: ${x.content}`).join("\n") + "\nAssistant:";
}
function cleanReply(t){ return t ? t.replace(/\n/g," ").replace(/\s+/g," ").trim() : "⚠️ AI busy"; }

async function fetchAI(prompt){
  try{
    const r = await axios.get("https://ai-api-sagor.vercel.app/sagor", { params:{ key:"sagor", prompt }, timeout:15000 });
    return r.data;
  }catch{ return null; }
}

async function processAI(bot, chatId, msg, text, userId){
  let history = memory.get(userId) || [];
  history.push({ role:"user", content:text });
  if(history.length>4) history=history.slice(-4);

  const data = await fetchAI(buildPrompt(history, detectLang(text)));
  if(!data){
    await bot.sendMessage(chatId, "❌ API Down", { reply_to_message_id: msg.message_id });
    return;
  }
  let reply = cleanReply(data.reply || data.data?.response || data.message);
  history.push({ role:"ai", content:reply });
  memory.set(userId, history);

  const sent = await bot.sendMessage(chatId, reply, { reply_to_message_id: msg.message_id });
  global.badol.onReply.set(sent.message_id, { commandName:"ai", author:userId, data:{ userId } });
}

module.exports = {
  config: {
    name: "ai",
    aliases: ["cat","gpt"],
    author: "MOHAMMAD BADOL",
    version: "3.0 FINAL",
    description: "AI reply on ? suffix",
    category: "ai",
    usePrefix: false,
    cooldown: 2,
    role: 0
  },

  BADOL: async function({ event, api, message, args, userId }){
    const text = args.join(" ").trim();
    if(!text) return message.reply("❌ লেখ কিছু! যেমন: ai কেমন আছো?");
    await processAI(api, event.chat.id, event, text, userId);
  },

  onChat: async function({ bot, msg, chatId }){
    try{
      if(!msg.text || msg.from?.is_bot) return;
      let body = msg.text.trim();
      if(body.startsWith("/") || body.startsWith("!") || body.startsWith(".")) return;
      
      // শেষে ? থাকলেই কাজ করবে
      if(body.endsWith("?") || body.endsWith("？")){
        let text = body.slice(0,-1).trim();
        if(!text) return;
        await processAI(bot, chatId, msg, text, msg.from.id);
      }
    }catch(e){ console.log(e.message); }
  },

  onReply: async function({ event, api, message }){
    const text = (event.text||"").trim();
    if(!text) return;
    await processAI(api, event.chat.id, event, text, event.from.id);
  }
};