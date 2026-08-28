// request.js - V11 FINAL - 100% MONGODB - NO JSON
module.exports = {
  config: {
    name: "request",
    aliases: ["req", "appeal"],
    author: "MOHAMMAD BADOL",
    version: "11.0",
    role: 0,
    cooldown: 5,
    description: "Unban request with bypass - MongoDB",
    usePrefix: false
  },

  async BADOL({ event, api, args }) {
    const chatId = event.chat.id;
    const userId = String(event.from.id);
    const userName = event.from.first_name || "User";

    const isBanned = await global.db.isUserBanned(userId).catch(() => false);
    if (!isBanned) return api.sendMessage(chatId, "✅ তুমি ব্যান নও, বট ইউজ করতে পারো!");

    if (!args[0]) {
      return api.sendMessage(chatId,
`📝 UNBAN REQUEST
━━━━━━━━━━━━
/request কারণ লিখো
Ex: /request ভাই মাফ করে দেন
Ex: /request help me
━━━━━━━━━━━━`);
    }

    if (args.length === 1 && args[0].toLowerCase() === "help") {
      return api.sendMessage(chatId,
`📝 UNBAN REQUEST
━━━━━━━━━━━━
/request কারণ লিখো
Ex: /request ভাই মাফ করে দেন
Ex: /request help me
━━━━━━━━━━━━`);
    }

    const reason = args.join(" ").trim();
    if (reason.length < 5) return api.sendMessage(chatId, "❌ কারণ বড় করে লিখো (৫ অক্ষরের বেশি)");

    const requestId = `unban_${userId}_${Date.now()}`;
    const data = {
      chatId: String(chatId),
      userId: String(userId),
      name: userName,
      reason,
      chatName: event.chat.title || userName,
      type: 'unban',
      addedBy: String(userId),
      createdAt: Date.now()
    };

    try { await global.db.addApproval('unban', data).then(id => { /* use returned id */ }); } catch {}
    // addApproval auto generates id, so we use manual id via direct method
    try { await global.db.Approval.create({ id: requestId, type: 'unban',...data }); } catch {}

    const adminMsg =
`🚨 NEW UNBAN REQUEST
━━━━━━━━━━━━
👤 Name: ${userName}
🆔 ID: ${userId}
📝 Reason: ${reason}
📍 Chat: ${chatId}
🕐 ${new Date().toLocaleString()}
━━━━━━━━━━━━`;

    const buttons = {
      inline_keyboard: [[
        { text: "✅ Approve", callback_data: `request_approve_${requestId}` },
        { text: "❌ Reject", callback_data: `request_reject_${requestId}` }
      ]]
    };

    const adminList = global.config.adminUID || global.config.ownerInfo?.botAdmins || [];
    for (const aid of adminList) {
      try { await api.sendMessage(aid, adminMsg, { reply_markup: buttons }); } catch {}
    }

    return api.sendMessage(chatId, "✅ রিকোয়েস্ট পাঠানো হয়েছে, এডমিন দেখবে! ⏳");
  },

  async onCallback({ event, api }) {
    const data = event.data || event.callbackQuery?.data || "";
    if (!data.startsWith("request_")) return;

    const chatId = event.message?.chat?.id;
    const msgId = event.message?.message_id;
    const parts = data.split("_");
    const action = parts[1];
    const requestId = parts.slice(2).join("_");

    try { await api.answerCallbackQuery(event.id, { text: action === "approve"? "✅ Approving..." : "❌ Rejecting..." }).catch(()=>{}); } catch {}

    let reqData = await global.db.getApproval?.(requestId).catch(()=>null);

    if (!reqData) {
      return api.editMessageText("❌ Request not found / Already handled!", {
        chat_id: chatId,
        message_id: msgId
      }).catch(()=>{});
    }

    if (action === "approve") {
      await global.db.unbanUser(String(reqData.userId)).catch(()=>{});
      await global.db.removeApproval(requestId).catch(()=>{});
      try {
        if (global.bot && reqData.chatId) {
          await global.bot.sendMessage(reqData.chatId,
`┏━━━━━━━━━━━━━━━━━━━┓
┃ ✅ APPROVED ✅ ┃
┣━━━━━━━━━━━━━━━━━━━┫
┃ 👤 ${reqData.name || reqData.userId}
┃ 🎉 আনব্যান করা হয়েছে
┃ এখন বট ইউজ করতে পারবে
┣━━━━━━━━━━━━━━━━━━━┫
┃ 🤖 EREN-AI
┗━━━━━━━━━━━━━━━━━━━┛`);
        }
      } catch {}
    } else {
      await global.db.removeApproval(requestId).catch(()=>{});
      try {
        const stillBanned = await global.db.isUserBanned(String(reqData.userId));
        if (stillBanned && global.bot && reqData.chatId) {
          await global.bot.sendMessage(reqData.chatId,
`┏━━━━━━━━━━━━━━━━━━━┓
┃ ❌ REJECTED ❌ ┃
┣━━━━━━━━━━━━━━━━━━━┫
┃ 👤 ${reqData.name || reqData.userId}
┃ 📝 রিকোয়েস্ট Reject করা হয়েছে
┣━━━━━━━━━━━━━━━━━━━┫
┃ 🤖 EREN-AI
┗━━━━━━━━━━━━━━━━━━━┛`);
        }
      } catch {}
    }

    const txt = action === "approve"
   ? `✅ APPROVED!\n━━━━━━━━━━━━\n👤 ${reqData.name}\n🆔 ${reqData.userId}\n📝 ${reqData.reason}`
      : `❌ REJECTED!\n━━━━━━━━━━━━\n👤 ${reqData.name}\n🆔 ${reqData.userId}\n📝 ${reqData.reason}`;

    return api.editMessageText(txt, {
      chat_id: chatId,
      message_id: msgId
    }).catch(()=>{});
  }
};