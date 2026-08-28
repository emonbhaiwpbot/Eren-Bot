// BADOL-CMDS/cmds/refer.js - FULL FIXED V4 - @erenaiteam ONLY + TOP 100%
module.exports = {
  config: {
    name: "refer",
    aliases: ["invite", "balance", "credit", "top10", "bal"],
    author: "MOHAMMAD BADOL",
    role: 0,
    description: "Referral + balance + top",
    cooldown: 2,
    category: "system"
  },
  BADOL: async function(o) {
    const ctx = o.ctx || o;
    const api = o.api || ctx.telegram;
    const chatId = o.chatId || ctx.chat?.id || ctx.from?.id;
    const referral = require('../../BADOL/referralSystem');
    const bot = await api.getMe().catch(()=>({username:"ErenAi1Bot"}));
    const userId = o.userId || ctx.from?.id;
    if (!userId) return;

    const text = o.message?.text || o.event?.text || ctx.message?.text || "";
    const args = text.split(" ").slice(1);
    const sub = (args[0] || "").toLowerCase();
    const isAdmin = ["6954597258", "8036137477"].includes(String(userId));

    if (sub === "add" && isAdmin) {
      const id = args[1];
      const amt = parseInt(args[2]);
      if (!id || isNaN(amt)) return api.sendMessage(chatId, "⚠️ Usage: /refer add <id> <amount>\nEx: /refer add 123456 10");
      const u = await referral.getUser(id);
      u.credits = (u.credits||0) + amt;
      await global.db.setUser(String(id), u);
      return api.sendMessage(chatId, `✅ ${amt} Added to ${id}\n💳 Now: ${u.credits} Credit`);
    }

    if (sub === "top" || sub === "top10") {
      const all = await global.db.getAllUsers();
      const top = all.filter(u=> (u.referrals||0) >0).sort((a,b)=>(b.referrals||0)-(a.referrals||0)).slice(0,10);
      let msg = `🏆 <b>TOP 10 Referrers</b>\n━━━━━━━━━━━━━━\n`;
      if(!top.length) msg+=`😔 No referrals yet\nBe first!`;
      else {
        top.forEach((u,i)=> {
          const name = u.userId;
          msg+=`${i+1}. <code>${name}</code> - ${u.referrals||0} Ref | ${u.credits||0} Cr\n`;
        });
      }
      return api.sendMessage(chatId, msg, { parse_mode: "HTML" });
    }

    const user = await referral.getUser(userId);
    const link = `https://t.me/${bot.username}?start=ref_${userId}`;
    const paid = referral.getPaidList();

    const box =
`✨ <b>BALANCE & REFER</b>
━━━━━━━━━━━━━━
💳 <b>Credit:</b> ${user.credits}
👥 <b>Refer:</b> ${user.referrals||0}
🔒 <b>Paid Cmds:</b> ${paid.length? paid.length+" টা Lock 🔒" : "All Free ✅"}

💡 <b>1 Invite = ${referral.REFERRER_BONUS} Credit</b>
💡 <b>Paid Use = 1 Credit</b>

🔗 <b>Your Link:</b>
<code>${link}</code>
━━━━━━━━━━━━━━
📌 <b>Must Join:</b> @erenaiteam
⚠️ Join না থাকলে Bonus পাবে না!`;

    await api.sendMessage(chatId, box, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📤 Share Link", switch_inline_query: `Free Credit! ${link}` }, { text: "🏆 Top 10", callback_data: "refer_top" }],
          [{ text: "📌 Join @erenaiteam (Must)", url: "https://t.me/erenaiteam" }]
        ]
      }
    });
  },

  onCallback: async function(o) {
    const ctx = o.ctx || o;
    const api = o.api || ctx.telegram;
    const chatId = o.chatId || ctx.chat?.id || ctx.callbackQuery?.message?.chat?.id || ctx.callbackQuery?.from?.id || ctx.from?.id;
    const data = ctx.callbackQuery?.data || o.event?.data || "";

    if (data!== "refer_top") return;

    try { await ctx.answerCbQuery("🏆 Loading Top...").catch(()=>{}); } catch {}

    try {
      const referral = require('../../BADOL/referralSystem');
      const all = await global.db.getAllUsers();
      const top = all.filter(u=> (u.referrals||0) >0).sort((a,b)=>(b.referrals||0)-(a.referrals||0)).slice(0,10);

      let msg = `🏆 <b>TOP 10 Referrers</b>\n━━━━━━━━━━━━━━\n`;
      if (!top.length) {
        msg += `😔 No referrals yet\nBe first to invite!`;
      } else {
        top.forEach((u,i)=> {
          msg+=`${i+1}. <code>${u.userId}</code> - ${u.referrals||0} Ref | ${u.credits||0} Cr\n`;
        });
      }
      msg+=`━━━━━━━━━━━━━━\n🔗 /refer - Your Link\n📌 Must Join: @erenaiteam`;

      await api.sendMessage(chatId, msg, { parse_mode: "HTML" });
    } catch(e) {
      await api.sendMessage(chatId, `❌ Error: ${e.message}`).catch(()=>{});
    }
  }
};