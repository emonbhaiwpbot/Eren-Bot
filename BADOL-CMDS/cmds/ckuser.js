module.exports = {
  config: {
    name: "ckuser",
    aliases: ["userck", "alluser"],
    author: "MOHAMMAD BADOL",
    version: "5.0-MONGO-FIXED",
    cooldown: 5,
    role: 1,
    category: "admin",
    usePrefix: true,
    description: "Real-time User & Group Count - 100% MongoDB Atlas"
  },

  BADOL: async function ({ api, chatId, event, args }) {
    try {
      if (!global.db ||!global.db.getAllUsers) {
        return await api.sendMessage(chatId, "❌ Database not loaded! Check BADOL-TG-BOT.js -> global.db", { reply_to_message_id: event.message_id });
      }

      // ✅ FIXED - getStats নাই, getAllUsers + getAllThreads আছে
      const allUsers = await global.db.getAllUsers();
      const allThreads = await global.db.getAllThreads();

      const groups = allThreads.filter(t => t.isGroup || String(t.id||"").startsWith("-"));
      const privates = allThreads.filter(t =>!t.isGroup &&!String(t.id||"").startsWith("-"));

      const approvedGroups = groups.filter(g => g.approved === true);

      let pendingGroups = [];
      try {
        if(global.db.getAllApprovals) pendingGroups = await global.db.getAllApprovals('group');
        else pendingGroups = allThreads.filter(t=> t.approved!==true && String(t.id).startsWith("-"));
      } catch { pendingGroups = []; }

      let banned = [];
      try {
        if(global.db.getAllBans) banned = await global.db.getAllBans();
        else banned = [];
      } catch { banned = []; }

      let totalMsg = 0;
      for (let t of allThreads) totalMsg += (t.totalMessages || 0);

      const now = Date.now();
      const activeUsers = allUsers.filter(u => (now - (u.lastSeen || 0)) < 24*60*60*1000).length;

      let sub = args[0]?.toLowerCase();

      if (sub === "list") {
        if (!allUsers.length) return await api.sendMessage(chatId, "❌ কোনো ইউজার নাই - MongoDB খালি\n📁 Collection: users empty", { reply_to_message_id: event.message_id });
        let txt = `👥 ALL USERS (${allUsers.length}) - MongoDB\n━━━━━━━━━━━━━━━━━━━━\n`;
        allUsers.slice(0, 80).forEach((u, i) => {
          let name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || "Unknown";
          let active = (now - (u.lastSeen || 0)) < 24*60*60*1000? "🟢" : "⚪";
          let msgs = typeof u.messageCount === 'object'? Object.values(u.messageCount).reduce((a,b)=>a+b,0) : (u.messageCount || 0);
          txt += `${i+1}. ${active} ${name}\nID: ${u.id} | 💬 ${msgs}\n`;
        });
        if (allUsers.length > 80) txt += `\n...আরো ${allUsers.length - 80} জন আছে\n`;
        txt += `\n🟢 = 24h Active (${activeUsers})`;
        return await api.sendMessage(chatId, txt, { reply_to_message_id: event.message_id });
      }

      if (sub === "gclist" || sub === "gc" || sub === "groups") {
        if (!groups.length) return await api.sendMessage(chatId, "❌ কোনো গ্রুপ নাই - MongoDB খালি\n📁 Collection: threads empty", { reply_to_message_id: event.message_id });
        let txt = `💬 ALL GROUPS (${groups.length}) - MongoDB\n━━━━━━━━━━━━━━━━━━━━\n`;
        groups.slice(0, 80).forEach((g, i) => {
          txt += `${i+1}. ${g.name || 'Unknown'}\nID: ${g.id}\n👥 ${g.totalUsers || 0} | 💬 ${g.totalMessages || 0} | ${g.approved===true? "✅" : "❌ OFF"}\n\n`;
        });
        if (groups.length > 80) txt += `\n...আরো ${groups.length - 80} টা আছে\n`;
        return await api.sendMessage(chatId, txt, { reply_to_message_id: event.message_id });
      }

      if (sub === "active") {
        const activeList = allUsers.filter(u => (now - (u.lastSeen || 0)) < 24*60*60*1000);
        if (!activeList.length) return await api.sendMessage(chatId, "❌ 24h তে কোনো Active User নাই", { reply_to_message_id: event.message_id });
        let txt = `🟢 ACTIVE USERS (24h) - ${activeList.length}/${allUsers.length}\n━━━━━━━━━━━━━━━━━━━━\n`;
        activeList.slice(0, 50).forEach((u,i)=>{
          let name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || u.id;
          txt += `${i+1}. ${name} | ${u.id}\n`;
        });
        return await api.sendMessage(chatId, txt, { reply_to_message_id: event.message_id });
      }

      const msg = `⚜️ BADOL-TG-BOT • REALTIME STATS - MONGODB
━━━━━━━━━━━━━━━━━━━━
👥 Total Users: ${allUsers.length}
🟢 Active (24h): ${activeUsers}
💬 Private Chats: ${privates.length}

💬 Total Groups: ${groups.length}
✅ Approved Groups: ${approvedGroups.length}
⏳ Pending/Off Groups: ${groups.length - approvedGroups.length}

🚫 Banned: ${banned.length}
💌 Total Messages: ${totalMsg}

━━━━━━━━━━━━━━━━━━━━
📁 DB: 100% MongoDB Atlas
• users → ${allUsers.length} users
• threads → ${allThreads.length} threads

📝 Use:
• /ckuser list - User লিস্ট
• /ckuser gclist - Group লিস্ট
• /ckuser active - Active লিস্ট

⏰ ${new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}`;

      return await api.sendMessage(chatId, msg, { reply_to_message_id: event.message_id });

    } catch (e) {
      console.error("ckuser error:", e);
      return await api.sendMessage(chatId, `❌ Error: ${e.message}\n${e.stack?.slice(0,500)}`, { reply_to_message_id: event.message_id });
    }
  }
};