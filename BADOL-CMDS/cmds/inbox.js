// BADOL-CMDS/cmds/inbox.js - PREMIUM BEST - DEV: MOHAMMAD BADOL
module.exports = {
  config: {
    name: "inbox",
    aliases: ["in", "ib"],
    author: "MOHAMMAD BADOL",
    version: "2.1",
    role: 0,
    cooldown: 3,
    description: "Premium Inbox System",
    category: "utility",
    usePrefix: true
  },

  BADOL: async function({ event, api, args, chatId, userId }) {
    const isGroup = String(chatId).startsWith("-") || event.chat?.type?.includes("group");
    const userName = event.from?.first_name || "User";
    const botUser = global.config?.botInfo?.username || "Eren-AI";

    if (!isGroup) {
      return api.sendMessage(chatId,
`╔════════════════════╗
║ 📩 PREMIUM INBOX 📩 ║
╚════════════════════╝

👋 হ্যালো ${userName}!

তুমি Already Inbox এ আছো!

💡 /help - সব কমান্ড
💡 /botabout - বটের Info

🤖 BADOL-TG-BOT 🟢`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🤖 About Bot", callback_data: "botabout_main" }],
            [{ text: "👑 Owner", url: "https://t.me/B4D9L_007" }, { text: "📢 Support", url: "https://t.me/BADOLBOTGC" }]
          ]
        }
      });
    }

    const inboxText = `╔════════════════════╗
║ 🕌 ﷽ - PREMIUM INBOX 🕌 ║
╚════════════════════╝

👋 আসসালামু আলাইকুম ${userName}!

📍 তুমি গ্রুপ থেকে ডেকেছিলে!
${args.length > 0? `\n💬 মেসেজ: ${args.join(" ")}\n` : ""}
━━━━━━━━━━━━━━━━━━━━
🤖 আমি Eren-AI 🟢
━━━━━━━━━━━━━━━━━━━━

নিচে থেকে সিলেক্ট করো! 👇`;

    const keyboard = {
      inline_keyboard: [
        [{ text: "📜 All Commands", callback_data: "help_all" }, { text: "🤖 About Bot", callback_data: "botabout_main" }],
        [{ text: "👑 Contact Owner", url: "https://t.me/B4D9L_007" }, { text: "📢 Support GC", url: "https://t.me/BADOLBOTGC" }]
      ]
    };

    try {
      await api.sendMessage(userId, inboxText, { reply_markup: keyboard });
      return api.sendMessage(chatId, `✅ @${event.from?.username || userName} ইনবক্স চেক করো! 📩`, { reply_to_message_id: event.message_id });
    } catch (e) {
      return api.sendMessage(chatId,
`❌ @${event.from?.username || userName} ইনবক্সে পাঠাতে পারিনি!

⚠️ তুমি আগে আমাকে Start দাওনি!

👇 Click করে Start দাও:`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚀 Start Bot", url: `https://t.me/${botUser}?start=inbox` }],
          ]
        }
      });
    }
  },

  onCallback: async function({ event, api, ctx }) {
    const data = event.data || event.callback_query?.data;
    if (data === "help_all") {
      try { await ctx.editMessageText(`📜 HELP MENU\n\n• /help - সব কমান্ড\n• /botabout - বটের Info\n• /inbox - ইনবক্স মেনু`); } catch {}
    }
    if (data === "botabout_main") {
      try {
        const cmd = global.badol.commands.get("botabout");
        if(cmd) await cmd.BADOL({ event, api, chatId: event.message.chat.id, userId: event.from.id });
      } catch {}
    }
    try { await ctx.answerCbQuery(); } catch {}
  }
};