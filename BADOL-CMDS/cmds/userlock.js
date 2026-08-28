module.exports = {
  config: {
    name: "userlock",
    aliases: ["namewatch", "ulock"],
    author: "MOHAMMAD BADOL",
    version: "4.0-MONGO-100%",
    description: "UserLock - Tracked + 3 Button - MongoDB",
    category: "security",
    usePrefix: true,
    role: 1,
    cooldown: 2
  },

  async getDB() {
    try {
      const cfg = await global.db.getConfig('nametracker');
      return cfg?.data || cfg || {};
    } catch { return {}; }
  },
  async saveDB(data) {
    try { await global.db.setConfig('nametracker', { data, updatedAt: Date.now() }); } catch {}
  },
  async getSettingDB() {
    try {
      const cfg = await global.db.getConfig('namewatch');
      return cfg || { globalEnabled: true };
    } catch { return { globalEnabled: true }; }
  },
  async saveSettingDB(data) {
    try { await global.db.setConfig('namewatch', {...data, updatedAt: Date.now() }); } catch {}
  },
  async isEnabled() {
    const db = await this.getSettingDB();
    return db.globalEnabled!== false;
  },

  BADOL: async function({ api, chatId }) {
    return sendPanel(api, chatId, null, null, this);
  },

  onCallback: async function({ event, api, ctx }) {
    const data = event.data || event.callback_query?.data;
    const chatId = event.message.chat.id;
    const msgId = event.message.message_id;
    try { await ctx.answerCbQuery(); } catch {}

    const self = module.exports;

    if (data === "ulock_on") {
      let db = await self.getSettingDB(); db.globalEnabled = true; await self.saveSettingDB(db);
      try { await api.sendMessage(chatId, `✅ UserLock Global ON! MongoDB`); } catch {}
      try { await api.deleteMessage(chatId, msgId).catch(()=>{}); } catch {}
      return;
    }
    if (data === "ulock_off") {
      let db = await self.getSettingDB(); db.globalEnabled = false; await self.saveSettingDB(db);
      try { await api.sendMessage(chatId, `❌ UserLock Global OFF! MongoDB`); } catch {}
      try { await api.deleteMessage(chatId, msgId).catch(()=>{}); } catch {}
      return;
    }
    if (data === "ulock_cancel") {
      try { await api.deleteMessage(chatId, msgId).catch(()=>{}); } catch {}
      return;
    }
  },

  onChat: async function({ api, msg, chatId }) {
    try {
      const self = module.exports;
      if (!msg ||!chatId) return;
      if (!String(chatId).startsWith("-")) return;
      const enabled = await self.isEnabled();
      if (!enabled) return;
      if (!msg.from) return;
      const from = msg.from;
      const userId = String(from.id);
      const current = {
        first_name: (from.first_name || "").trim(),
        last_name: (from.last_name || "").trim(),
        username: (from.username || "").trim(),
        date: new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })
      };
      const db = await self.getDB();
      const old = db[userId];
      if (!old) { db[userId] = { current, history: [] }; await self.saveDB(db); return; }
      const oldFirst = (old.current.first_name||"").trim();
      const oldLast = (old.current.last_name||"").trim();
      const oldUser = (old.current.username||"").trim();
      if (oldFirst===current.first_name && oldLast===current.last_name && oldUser===current.username) return;

      if (!old.history) old.history = [];
      old.history.push({...old.current});
      if (old.history.length > 20) old.history.shift();

      let notice = `🚨 <b>USERLOCK DETECTED!</b>\n━━━━━━━━━━━━━━━━━━\n`;
      notice += `👤 নাম: <b>${current.first_name} ${current.last_name||""}</b>\n`;
      notice += `🆔 আইডি: <code>${userId}</code>\n`;
      notice += `🔗 মেনশন: <a href="tg://user?id=${userId}">${current.first_name}</a>\n`;
      notice += `━━━━━━━━━━━━━━━━━━\n\n📝 <b>পরিবর্তন বিবরণ:</b>\n`;
      if (oldFirst!==current.first_name) notice += `• First: <b>${oldFirst||"নাই"}</b> → <b>${current.first_name||"নাই"}</b>\n`;
      if (oldLast!==current.last_name) notice += `• Last: <b>${oldLast||"নাই"}</b> → <b>${current.last_name||"নাই"}</b>\n`;
      if (oldUser!==current.username) notice += `• Username: @${oldUser||"নাই"} → @${current.username||"নাই"}\n`;
      notice += `\n━━━━━━━━━━━━━━━━━━\n⏰ ${current.date} - MongoDB`;
      await api.sendMessage(chatId, notice, { parse_mode: "HTML" }).catch(()=>{});
      db[userId] = { current, history: old.history };
      await self.saveDB(db);
    } catch {}
  }
};

async function sendPanel(api, chatId, ctx, extra="", self) {
  if(!self) self = module.exports;
  const setting = await self.getSettingDB();
  const enabled = setting.globalEnabled!== false;
  const db = await self.getDB();
  const total = Object.keys(db).length;

  const text = `${extra||""}╭─❖─〔 UserLock Panel MongoDB 〕─❖─╮\n│ Status: ${enabled? "🟢 ON" : "🔴 OFF"} (All Groups Atlas)\n│ 📊 Tracked Users: ${total} জন\n│\n│ • নাম Change করলে Notice দিবে\n╰─❖─〔 EREN-AI MongoDB 〕─❖─╯`;

  const kb = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🟢 ON", callback_data: "ulock_on" }, { text: "🔴 OFF", callback_data: "ulock_off" }],
        [{ text: "❌ Cancel", callback_data: "ulock_cancel" }]
      ]
    }
  };
  if (ctx) { try { await ctx.editMessageText(text, kb); } catch {} }
  else { await api.sendMessage(chatId, text, kb).catch(()=>{}); }
}