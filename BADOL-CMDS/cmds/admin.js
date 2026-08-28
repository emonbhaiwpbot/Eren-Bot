const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "admin",
    aliases: ["botadmin", "admins"],
    author: "MOHAMMAD BADOL",
    version: "3.1-FIXED-SINGLE-PATH",
    description: "Bot Admin Management - Permanent Save MongoDB",
    category: "owner",
    usePrefix: true,
    cooldown: 3,
    role: 2,
    guide: "{pn}admin [add/remove/list] [@mention / reply / UID]"
  },

  BADOL: async function ({ event, api, message, args }) {
    function safeName(str, len = 28) {
      try {
        if (!str) return "Unknown User";
        str = String(str).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
        if (!str) return "Unknown User";
        const arr = Array.from(str);
        if (arr.length > len) return arr.slice(0, len).join("") + "…";
        return arr.join("");
      } catch { return "Unknown User"; }
    }

    async function saveConfig() {
      try {
        if (!global.config.ownerInfo) global.config.ownerInfo = {};
        if (global.config.ownerInfo?.botAdmins) {
          global.config.adminUID = global.config.ownerInfo.botAdmins;
        }
        // ✅ SINGLE CORRECT PATH: /home/container/config.js
        const configPath = path.join(__dirname, "../../config.js");
        try {
          if(fs.existsSync(configPath)){
            const raw = fs.readFileSync(configPath, "utf8");
            // config.js is JS not JSON - so we update global.config and overwrite via JS export
            // If config.js is JSON style, write JSON
            if(raw.trim().startsWith("{")){
              const existing = JSON.parse(raw);
              existing.ownerInfo = global.config.ownerInfo;
              existing.adminUID = global.config.adminUID;
              fs.writeFileSync(configPath, JSON.stringify(existing, null, 2), 'utf8');
            } else {
              // It's JS file - update via require cache
              fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(global.config, null, 2)};`, 'utf8');
            }
          }
        } catch(e){ console.log("File save err:", e.message); }
        // ✅ MONGODB SAVE
        try {
          if(global.db.setConfig) await global.db.setConfig('botAdmins', { list: global.config.ownerInfo.botAdmins });
          if(global.db.db){
            await global.db.db.collection("configs").updateOne({ key: "botAdmins" }, { $set: { list: global.config.ownerInfo.botAdmins } }, { upsert: true });
          }
        } catch(e){ console.log("Mongo admin save error:", e.message); }
        return true;
      } catch (e) {
        console.error("Admin Save Error:", e);
        return false;
      }
    }

    const action = (args[0] || "").toLowerCase();
    const botName = safeName(global.config?.botInfo?.name || "Eren-AI", 18);
    const prefix = global.config?.botInfo?.prefix || global.config?.prefix || '/';

    if (action === "list") {
      const botAdmins = global.config?.ownerInfo?.botAdmins || global.config?.adminUID || [];
      if (botAdmins.length === 0) {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ No bot admins found!\n╰──────────────────╯`);
      }
      let listText = `╭─❖─〔 ${botName} 〕─❖─╮\n│ Admin List (${botAdmins.length})\n├──────────────────┤`;
      for (let i = 0; i < botAdmins.length; i++) {
        const admId = String(botAdmins[i]);
        let admName = "Admin User";
        let admUsername = "None";
        try {
          const chat = await api.getChat(admId);
          admName = safeName(chat.first_name || chat.title || "Admin", 16);
          admUsername = chat.username? `@${chat.username}` : "None";
        } catch {
          try {
            const dbUser = await global.db.getUser(admId);
            if (dbUser?.firstName) admName = safeName(dbUser.firstName, 16);
          } catch {}
        }
        listText += `\n│\n│ #${i + 1}\n│ Name: ${admName}\n│ Username: ${admUsername}\n│ ID: ${admId}`;
      }
      listText += `\n├──────────────────┤\n│ Total: ${botAdmins.length} Admins\n╰──────────────────╯`;
      return await message.reply(listText);
    }

    let targetId = null;
    if (event.reply_to_message) {
      targetId = event.reply_to_message.from.id;
    } else if (args[1]) {
      const query = args[1].replace("@", "").trim();
      if (!isNaN(query)) {
        targetId = query;
      } else {
        try {
          const chatMember = await api.getChat(`@${query}`);
          if (chatMember?.id) targetId = String(chatMember.id);
        } catch {}
      }
    } else if (event.entities) {
      for (const entity of event.entities) {
        if (entity.type === 'text_mention') {
          targetId = String(entity.user.id);
          break;
        }
      }
    }

    if (!targetId && (action === "add" || action === "remove")) {
      return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ Usage:\n│ ${prefix}admin add @mention/reply/uid\n│ ${prefix}admin remove @mention/reply/uid\n│ ${prefix}admin list\n╰──────────────────╯`);
    }

    if (!global.config.ownerInfo) global.config.ownerInfo = {};
    if (!global.config.ownerInfo.botAdmins) global.config.ownerInfo.botAdmins = global.config.adminUID || [];
    global.config.ownerInfo.botAdmins = global.config.ownerInfo.botAdmins.map(id => String(id));

    if (action === "add") {
      targetId = String(targetId);
      if (global.config.ownerInfo.botAdmins.includes(targetId)) {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ Already an admin!\n│ ID: ${targetId}\n╰──────────────────╯`);
      }
      global.config.ownerInfo.botAdmins.push(targetId);
      const saved = await saveConfig();
      if (saved) {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ Admin added successfully!\n│ ID: ${targetId}\n│ Saved permanently!\n╰──────────────────╯`);
      } else {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ Added to memory but save failed!\n╰──────────────────╯`);
      }
    }

    if (action === "remove") {
      targetId = String(targetId);
      const mainOwnerId = String(global.config?.ownerInfo?.mainOwner?.id || global.config?.ownerInfo?.mainOwner?.[0]?.id || "");
      const isMainOwner = mainOwnerId && targetId === mainOwnerId;

      if (isMainOwner) {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ Cannot remove main owner!\n│ ID: ${targetId}\n╰──────────────────╯`);
      }

      const index = global.config.ownerInfo.botAdmins.indexOf(targetId);
      if (index === -1) {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ Not found in admin list!\n│ ID: ${targetId}\n╰──────────────────╯`);
      }
      global.config.ownerInfo.botAdmins.splice(index, 1);
      const saved = await saveConfig();
      if (saved) {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ Admin removed successfully!\n│ ID: ${targetId}\n│ Saved permanently!\n╰──────────────────╯`);
      } else {
        return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ Removed from memory but save failed!\n╰──────────────────╯`);
      }
    }

    return await message.reply(`╭─❖─〔 ${botName} 〕─❖─╮\n│ Usage: admin [add/remove/list]\n╰──────────────────╯`);
  }
};