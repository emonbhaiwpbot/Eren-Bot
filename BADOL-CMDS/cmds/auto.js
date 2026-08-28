const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'BADOL/auto.json');

module.exports = {
  config: {
    name: "auto",
    aliases: ["ato", "filter", "autoreply"],
    author: "MOHAMMAD BADOL",
    version: "2.1-REPLY",
    description: "Auto Reply with Reply",
    category: "admin",
    usePrefix: true,
    role: 1,
    cooldown: 2
  },

  BADOL: async function({ api, chatId, userId, event, args, ctx }) {
    const chat = chatId || event?.chat?.id;
    const action = args?.[0]?.toLowerCase();
    try { if (ctx?.react) await ctx.react("⏳").catch(()=>{}); } catch {}
    let db = loadDB();
    if (!action ||!["add", "del", "delete", "list", "remove"].includes(action)) {
      try { if (ctx?.react) await ctx.react("✅").catch(()=>{}); } catch {}
      return api.sendMessage(chat, box(`1. /auto add [trigger] - [reply]\n2. /auto del [trigger]\n3. /auto list`));
    }
    if (action === "add") {
      const fullText = args.slice(1).join(" ");
      let parts = [];
      if (fullText.includes(" - ")) parts = fullText.split(" - ");
      else if (fullText.includes("-")) parts = fullText.split("-");
      else if (fullText.includes("|")) parts = fullText.split("|");
      if (parts.length < 2) return api.sendMessage(chat, box("❌ /auto add hi - Hello!"));
      const trigger = parts[0].trim().toLowerCase();
      const reply = parts.slice(1).join(" - ").trim();
      if (db[trigger]) {
        try { if (ctx?.react) await ctx.react("⚠️").catch(()=>{}); } catch {}
        return api.sendMessage(chat, box(`⚠️ Already Exists!\n${trigger} ➡️ ${db[trigger]}\nDel: /auto del ${trigger}`));
      }
      db[trigger] = reply;
      saveDB(db);
      try { if (ctx?.react) await ctx.react("✅").catch(()=>{}); } catch {}
      return api.sendMessage(chat, box(`✅ Added!\n${trigger} ➡️ ${reply}`));
    }
    else if (["del","delete","remove"].includes(action)) {
      const trigger = args.slice(1).join(" ").trim().toLowerCase();
      if (!db[trigger]) return api.sendMessage(chat, box(`❌ '${trigger}' not found!`));
      delete db[trigger];
      saveDB(db);
      try { if (ctx?.react) await ctx.react("✅").catch(()=>{}); } catch {}
      return api.sendMessage(chat, box(`✅ '${trigger}' Deleted!`));
    }
    else if (action === "list") {
      const keys = Object.keys(db);
      if (keys.length === 0) return api.sendMessage(chat, box("❌ List Empty!"));
      let listMsg = "📝 Auto List:\n\n";
      keys.forEach((k, i) => listMsg += `${i + 1}. ${k} ➡️ ${db[k]}\n`);
      return api.sendMessage(chat, box(listMsg + `\nTotal: ${keys.length}`));
    }
  },

  // ✅ REPLY FIXED - এখন User এর Message এ Reply দিবে
  onChat: async function({ api, msg, chatId, event }) {
    try {
      const messageText = msg?.text || msg?.caption || event?.text || "";
      if (!messageText) return;
      const body = messageText.trim().toLowerCase();
      const db = loadDB();
      if (db[body]) {
        const messageId = msg?.message_id || event?.message_id;
        // ✅ Reply to User Message
        await api.sendMessage(chatId, db[body], {
          reply_to_message_id: messageId
        }).catch(async () => {
          // Fallback if reply fails
          await api.sendMessage(chatId, db[body]).catch(()=>{});
        });
      }
    } catch {}
  }
};

function loadDB() {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 4));
      return {};
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch { return {}; }
}
function saveDB(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 4));
  } catch {}
}
function box(msg) {
  return `┌───────────────┐\n ✨ AUTO SYSTEM ✨\n└───────────────┘\n${msg}\n━━━━━━━━━━━━━━━━━`;
}