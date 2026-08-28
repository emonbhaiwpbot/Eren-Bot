const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "adminonly",
    aliases: ["wl", "whitelist", "adminmode", "onlyadmin"],
    version: "3.1-FIXED",
    author: "MOHAMMAD BADOL",
    role: 2,
    description: "Admin Only Mode Toggle - MongoDB 100%",
    category: "owner",
    cooldown: 3,
    usePrefix: true
  },

  BADOL: async function({ api, chatId, args }) {

    async function getSettings() {
      try {
        const data = await global.db.getConfig('adminOnly');
        if (data) return data.enabled === true || data.value === true;
      } catch {}
      const cfg = global.config || {};
      const st = cfg.settings || {};
      if (st.adminOnlyMode!== undefined) return st.adminOnlyMode === true;
      if (st.onlyAdmin!== undefined) return st.onlyAdmin === true;
      return false;
    }

    async function saveState(enabled) {
      if (!global.config.settings) global.config.settings = {};
      global.config.settings.adminOnlyMode = enabled;
      global.config.settings.onlyAdmin = enabled;
      // ✅ MONGODB SAVE
      try {
        await global.db.setConfig('adminOnly', { enabled, time: Date.now() });
        if(global.db.updateSettings){
          await global.db.updateSettings({ adminOnlyMode: enabled, onlyAdmin: enabled });
        }
      } catch(e){ console.log("Mongo save err:", e.message); }
      // ✅ FILE SAVE - SINGLE CORRECT PATH: /home/container/config.js
      try {
        const configPath = path.join(__dirname, "../../config.js");
        if(fs.existsSync(configPath)){
          const raw = fs.readFileSync(configPath, "utf8");
          if(raw.trim().startsWith("{")){
            // JSON
            const cfg = JSON.parse(raw);
            if(!cfg.settings) cfg.settings = {};
            cfg.settings.adminOnlyMode = enabled;
            cfg.settings.onlyAdmin = enabled;
            fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');
          } else {
            // JS file - module.exports = {...}
            // Update global.config and write as JS
            global.config.settings.adminOnlyMode = enabled;
            global.config.settings.onlyAdmin = enabled;
            fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(global.config, null, 2)};`, 'utf8');
          }
        }
      } catch(e){ console.log("File save err:", e.message); }
    }

    const sub = (args[0] || "").toLowerCase();
    const current = await getSettings();
    const botName = global.config?.botInfo?.name || "Eren-AI";
    const prefix = global.config?.botInfo?.prefix || "/";

    if (!sub ||!["on", "off", "status", "toggle"].includes(sub)) {
      return await api.sendMessage(chatId,
        `╭─❖─〔 ${botName} 〕─❖─╮\n` +
        `│ Current Status: ${current? "ON - Admin Only" : "OFF - Public"}\n` +
        `├──────────────────┤\n` +
        `│ Usage:\n` +
        `│ ${prefix}adminonly on - Enable\n` +
        `│ ${prefix}adminonly off - Disable\n` +
        `│ ${prefix}adminonly status - Check\n` +
        `╰──────────────────╯`
      );
    }

    if (sub === "status") {
      return await api.sendMessage(chatId,
        `╭─❖─〔 ${botName} 〕─❖─╮\n` +
        `│ Admin Only Mode\n` +
        `│ Status: ${current? "ON - Only admins can use bot" : "OFF - Everyone can use bot"}\n` +
        `│ DB: MongoDB + File\n` +
        `│ Saved: 100% Permanent\n` +
        `╰──────────────────╯`
      );
    }

    if (sub === "on" || sub === "toggle") {
      if (current && sub === "on") {
        return await api.sendMessage(chatId, `Already enabled! Admin only mode is ON.`);
      }
      const newState = sub === "toggle"?!current : true;
      await saveState(newState);
      return await api.sendMessage(chatId,
        newState
      ? `✅ Admin only mode enabled! Only admins can use the bot now. Saved File + MongoDB.`
        : `✅ Admin only mode disabled! Everyone can use the bot now. Saved File + MongoDB.`
      );
    }

    if (sub === "off") {
      if (!current) return await api.sendMessage(chatId, `Already disabled! Admin only mode is OFF.`);
      await saveState(false);
      return await api.sendMessage(chatId, `✅ Admin only mode disabled! Everyone can use the bot now. Saved File + MongoDB.`);
    }
  }
};