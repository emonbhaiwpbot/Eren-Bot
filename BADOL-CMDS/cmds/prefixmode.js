const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "prefixmode",
    version: "1.1-FIXED",
    author: "MOHAMMAD BADOL",
    role: 2,
    category: "admin",
    description: "Toggle all commands to no-prefix mode - MongoDB",
    usePrefix: true,
    cooldown: 3
  },

  BADOL: async function({ event, api, args, message }) {

    let data = { enabled: false };
    try {
      const cfg = await global.db.getConfig('prefixMode');
      if (cfg) data.enabled = cfg.enabled === true || cfg.value === true;
    } catch {}

    const action = args[0]?.toLowerCase();

    if (!action ||!["on","off","status"].includes(action)) {
      return message.reply(
        `⚙️ PrefixMode System (MongoDB)\n\n`+
        `📌 Current: ${data.enabled? "ON (All No-Prefix)" : "OFF (Normal)"}\n\n`+
        `• ${global.config.prefix}prefixmode on - সব কমান্ড No Prefix\n`+
        `• ${global.config.prefix}prefixmode off - আগের মতো Prefix/NoPrefix\n`+
        `• ${global.config.prefix}prefixmode status - স্ট্যাটাস দেখো`
      );
    }

    if (action === "status") {
      return message.reply(`📌 PrefixMode: ${data.enabled? "ON ✅" : "OFF ❌"}\n${data.enabled? "এখন সব কমান্ড Prefix ছাড়াই কাজ করবে।" : "এখন config অনুযায়ী Prefix/NoPrefix কাজ করবে।"}\n💾 DB: MongoDB + File`);
    }

    async function saveFile(enabled){
      global.config.prefixModeEnabled = enabled;
      if(!global.config.settings) global.config.settings = {};
      global.config.settings.prefixModeEnabled = enabled;
      // ✅ MONGODB
      await global.db.setConfig('prefixMode', { enabled, updatedAt: Date.now() });
      // ✅ SINGLE PATH FILE: /home/container/config.js
      try{
        const configPath = path.join(__dirname, "../../config.js");
        if(fs.existsSync(configPath)){
          const raw = fs.readFileSync(configPath, "utf8");
          if(raw.trim().startsWith("{")){
            const cfg = JSON.parse(raw);
            if(!cfg.settings) cfg.settings = {};
            cfg.settings.prefixModeEnabled = enabled;
            cfg.prefixModeEnabled = enabled;
            fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');
          } else {
            fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(global.config, null, 2)};`, 'utf8');
          }
        }
      }catch(e){ console.log("prefixmode file save err:", e.message); }
    }

    if (action === "on") {
      await saveFile(true);
      return message.reply(`✅ PrefixMode ON (File + MongoDB Saved)\nএখন থেকে সব কমান্ড Prefix ছাড়া কাজ করবে।\nBot restart করলেও ON থাকবে।\nOff করতে: ${global.config.prefix}prefixmode off`);
    }

    if (action === "off") {
      await saveFile(false);
      return message.reply(`❌ PrefixMode OFF (File + MongoDB Saved)\n\nএখন আগের মতো usePrefix true/false অনুযায়ী কাজ করবে।`);
    }
  }
};