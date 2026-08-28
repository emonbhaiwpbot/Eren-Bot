const ALWAYS_ALLOWED = ["gcmd"];

function resolveName(input) {
  const low = String(input).toLowerCase();
  const specials = ["welcome","leave","antilink","spammute","spam","autoreact","alwaysemoji","adminonly","autodl","unsend"];
  if (specials.includes(low)) return low;

  if (global.badol && global.badol.commands) {
    const direct = global.badol.commands.get(low);
    if (direct) return direct.config.name.toLowerCase();
    for (const [_, c] of global.badol.commands) {
      if (c.config.aliases && c.config.aliases.map(a=>a.toLowerCase()).includes(low)) {
        return c.config.name.toLowerCase();
      }
    }
  }
  return low;
}

async function getAll() {
  try {
    const cfg = await global.db.getConfig('groupCommands');
    if(cfg?.data) return cfg.data;
    if(cfg &&!cfg.list) return cfg;
    // fallback to getAllGroupCommands
    if(global.db.getAllGroupCommands){
      return await global.db.getAllGroupCommands();
    }
    return {};
  } catch { return {}; }
}

async function saveAll(data) {
  try {
    // ✅ SAVE TO BOTH PLACES - Main Fix
    await global.db.setConfig('groupCommands', { data, updatedAt: Date.now() });
    // ✅ Also save to getAllGroupCommands system if exists
    if(global.db.setGroupCommands){
      for(const gid in data){
        await global.db.setGroupCommands(gid, data[gid]);
      }
    }
    if(global.db.db){
      await global.db.db.collection("groupCommands").updateOne({ key: "all" }, { $set: { data } }, { upsert: true });
    }
  } catch(e){ console.log("gcmd save err:", e.message); }
  // ✅ CACHE CLEAR - Main Fix
  if(global._settingCache) global._settingCache.time = 0;
  if(global._gcmdCache) global._gcmdCache.time = 0;
}

module.exports = {
  config: {
    name: "gcmd",
    aliases: ["grouplock","gclock","wl","whitelist"],
    author: "MOHAMMAD BADOL",
    version: "8.1-FIXED-DOUBLE-SAVE",
    description: "Per-Group Command + Settings Whitelist - MongoDB",
    category: "admin",
    usePrefix: true,
    role: 1,
    cooldown: 2
  },

  BADOL: async function({ api, chatId, args, message, event }) {
    const all = await getAll();
    const gid = String(chatId);

    if (!String(chatId).startsWith("-")) {
      return message.reply("❌ এই কমান্ড শুধু গ্রুপে কাজ করবে!");
    }

    const sub = (args[0]||"").toLowerCase();

    if (!sub || sub === "help") {
      return message.reply(
`⚙️ GCMD - GROUP COMMAND CONTROL V8.1 Fixed

/gcmd on → Whitelist ON (সব OFF, শুধু allow করা গুলা চলবে)
/gcmd off → সব ON
/gcmd allow help ai admin welcome leave antilink spammute autoreact
/gcmd remove ai
/gcmd list → লিস্ট দেখো
/gcmd reset → ডিলিট

📌 Alias সাপোর্ট: /gcmd allow h = help
📌 Setting Keywords: welcome, leave, antilink, spammute, autoreact

Example:
/gcmd on
/gcmd allow help ai welcome leave antilink spammute`
      );
    }

    if (sub === "on") {
      if (!all[gid]) all[gid] = { mode: "whitelist", enabled: [] };
      all[gid].mode = "whitelist";
      if (all[gid].enabled.length === 0) {
        all[gid].enabled = ["help","gcmd"];
      }
      if (!all[gid].enabled.includes("gcmd")) all[gid].enabled.push("gcmd");
      await saveAll(all);
      return message.reply(`✅ Whitelist ON (MongoDB + Cache Cleared)\nএখন এই গ্রুপে শুধু: ${all[gid].enabled.join(", ")}\n\n/gcmd allow <name> দিয়ে এড করো।`);
    }

    if (sub === "off") {
      delete all[gid];
      await saveAll(all);
      // Also delete from groupCommands collection
      try{
        if(global.db.deleteGroupCommands) await global.db.deleteGroupCommands(gid);
        if(global.db.db) await global.db.db.collection("groupCommands").deleteOne({ id: gid });
      }catch{}
      return message.reply(`✅ Whitelist OFF (MongoDB)\nএখন এই গ্রুপে সব কমান্ড + setting.js এর সেটিংস চলবে।`);
    }

    if (sub === "allow" || sub === "add" || sub === "enable") {
      const names = args.slice(1).map(n=>resolveName(n)).filter(Boolean);
      if (names.length === 0) return message.reply("❌ নাম দাও: /gcmd allow help ai");

      if (!all[gid]) all[gid] = { mode: "whitelist", enabled: ["help","gcmd"] };
      all[gid].mode = "whitelist";

      for (const n of names) {
        if (!all[gid].enabled.map(c=>c.toLowerCase()).includes(n.toLowerCase())) {
          all[gid].enabled.push(n);
        }
      }
      if (!all[gid].enabled.map(c=>c.toLowerCase()).includes("gcmd")) all[gid].enabled.push("gcmd");
      await saveAll(all);
      return message.reply(`✅ Allowed: ${names.join(", ")}\n\nNow Active: ${all[gid].enabled.join(", ")}`);
    }

    if (sub === "remove" || sub === "disallow" || sub === "del" || sub === "rm") {
      const names = args.slice(1).map(n=>resolveName(n)).filter(Boolean);
      if (names.length === 0) return message.reply("❌ নাম দাও: /gcmd remove ai");

      if (!all[gid]) return message.reply("❌ এই গ্রুপে কোনো whitelist নাই।");

      const lowNames = names.map(n=>n.toLowerCase());
      if (lowNames.includes("gcmd")) return message.reply("❌ gcmd রিমুভ করা যাবে না! নইলে আনলক করতে পারবি না।");

      all[gid].enabled = all[gid].enabled.filter(c=>!lowNames.includes(c.toLowerCase()));
      if (all[gid].enabled.length === 0) all[gid].enabled = ["help","gcmd"];
      await saveAll(all);
      return message.reply(`✅ Removed: ${names.join(", ")}\n\nNow Active: ${all[gid].enabled.join(", ")}`);
    }

    if (sub === "list" || sub === "show") {
      if (!all[gid]) return message.reply("ℹ️ এই গ্রুপে Whitelist OFF আছে - সব চলছে।\n\n/gcmd on দিলে সব OFF হবে।");
      return message.reply(
`📋 GROUP: ${event.chat.title || chatId}
Mode: ${all[gid].mode} - MongoDB Fixed
Enabled (${all[gid].enabled.length}):
${all[gid].enabled.join(", ")}

→ /gcmd allow <name>
→ /gcmd remove <name>
→ /gcmd off`
      );
    }

    if (sub === "reset" || sub === "clear") {
      delete all[gid];
      await saveAll(all);
      try{
        if(global.db.deleteGroupCommands) await global.db.deleteGroupCommands(gid);
        if(global.db.db) await global.db.db.collection("groupCommands").deleteOne({ id: gid });
      }catch{}
      return message.reply("✅ Reset Done - Whitelist OFF (MongoDB + Cache Cleared)");
    }

    return message.reply("❌ Use: /gcmd help");
  }
};