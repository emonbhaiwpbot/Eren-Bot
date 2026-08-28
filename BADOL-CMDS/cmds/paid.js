// BADOL-CMDS/cmds/paid.js - V3 FIXED - NO PATH ERROR
module.exports = {
  config: {
    name: "paid",
    aliases: ["paidlist", "freecmd"],
    author: "MOHAMMAD BADOL",
    role: 2,
    description: "Paid manager auto json + alias lock - FIXED",
    cooldown: 2,
    category: "owner",
    usePrefix: true
  },

  BADOL: async function(o) {
    const fs = require('fs');
    const path = require('path');

    const ctx = o.ctx || o;
    const api = o.api || ctx.telegram || o.bot;
    const chatId = o.chatId || ctx.chat?.id || o.event?.chat?.id;
    const userId = o.userId || ctx.from?.id || o.event?.from?.id;
    if (!userId) return;

    const OWNER_IDS = ["6954597258", "8036137477"];
    if (!OWNER_IDS.includes(String(userId))) return api.sendMessage(chatId, "⛔ Owner Only!");

    // ✅ 100% SAFE PATH - referralSystem থাক বা না থাক
    let PAID_PATH;
    let referralSystem = null;
    try{
      referralSystem = require('../../BADOL/referralSystem');
      PAID_PATH = referralSystem.PAID_PATH;
    }catch(e){}

    // Fallback if PAID_PATH undefined
    if(!PAID_PATH || typeof PAID_PATH!== 'string'){
      PAID_PATH = path.join(__dirname, "../../BADOL-CACHE/paid.json");
      // second fallback
      if(!fs.existsSync(path.dirname(PAID_PATH))){
        PAID_PATH = path.join(__dirname, "../../BADOL/paid.json");
      }
    }

    function ensureFile() {
      try {
        const dir = path.dirname(PAID_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!fs.existsSync(PAID_PATH)) {
          fs.writeFileSync(PAID_PATH, JSON.stringify([], null, 2), 'utf8');
        }
      } catch(e){ console.log("ensureFile err:", e.message); }
    }
    ensureFile();

    function getPaid() {
      try {
        ensureFile();
        const raw = fs.readFileSync(PAID_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed)? parsed : [];
      } catch {
        return [];
      }
    }

    function savePaid(list) {
      try{
        const clean = [...new Set(list.map(v => String(v).toLowerCase().trim()).filter(Boolean))];
        fs.writeFileSync(PAID_PATH, JSON.stringify(clean, null, 2), 'utf8');
        return clean;
      }catch(e){
        console.log("savePaid err:", e.message);
        return list;
      }
    }

    function getRealName(name){
      try{
        if(referralSystem && typeof referralSystem.getRealName === 'function'){
          return referralSystem.getRealName(name);
        }
      }catch{}
      return String(name).toLowerCase().trim();
    }

    const text = o.message?.text || o.event?.text || ctx.message?.text || "";
    const args = text.split(" ").slice(1);
    const sub = (args[0] || "").toLowerCase();
    const items = args.slice(1).map(v => v.toLowerCase().trim()).filter(Boolean);

    if (!sub) {
      const list = getPaid();
      return api.sendMessage(chatId,
`🔒 <b>PAID MANAGER - FIXED V3</b>
━━━━━━━━━━━━━━
📌 /paid add ai terabox
📌 /paid del ai
📌 /paid list
📌 /paid clear

📂 Path: ${PAID_PATH.split("/").slice(-2).join("/")}
💡 Alias Auto Lock

<b>Now Paid (${list.length}):</b> ${list.join(", ") || "None - All Free ✅"}`,
        { parse_mode: "HTML" }
      );
    }

    if (sub === "add") {
      if (!items.length) return api.sendMessage(chatId, "⚠️ Usage: /paid add ai terabox gen");
      let paid = getPaid();
      let added = [];
      for (const raw of items) {
        const real = getRealName(raw).toLowerCase();
        if (!paid.includes(real)) {
          paid.push(real);
          added.push(real);
        }
      }
      const saved = savePaid(paid);
      return api.sendMessage(chatId,
`✅ <b>Added to Paid!</b>
➕ ${added.join(", ") || "Already Added"}
🔒 Alias সহ Lock

<b>Now Paid (${saved.length}):</b> ${saved.join(", ")}`,
        { parse_mode: "HTML" }
      );
    }

    if (sub === "del" || sub === "remove" || sub === "free") {
      if (!items.length) return api.sendMessage(chatId, "⚠️ Usage: /paid del ai");
      let paid = getPaid();
      let removed = [];
      for (const raw of items) {
        const real = getRealName(raw).toLowerCase();
        if (paid.includes(real)) removed.push(real);
        paid = paid.filter(p => p!== real);
      }
      const saved = savePaid(paid);
      return api.sendMessage(chatId,
`🗑️ <b>Removed from Paid!</b>
➖ ${removed.join(", ") || "Not Found"}
✅ Now Public

<b>Now Paid (${saved.length}):</b> ${saved.join(", ") || "All Free ✅"}`,
        { parse_mode: "HTML" }
      );
    }

    if (sub === "list") {
      const paid = getPaid();
      if (!paid.length) return api.sendMessage(chatId, `🔒 <b>Paid List</b>\n\n✅ সব Free - Join লাগবে না`, { parse_mode: "HTML" });
      return api.sendMessage(chatId,
`🔒 <b>Paid List (${paid.length})</b>
━━━━━━━━━━━━━━
${paid.map((v,i)=> `${i+1}. ${v} 🔒`).join("\n")}

💡 বাকি Auto Public ✅`,
        { parse_mode: "HTML" }
      );
    }

    if (sub === "clear") {
      savePaid([]);
      return api.sendMessage(chatId, `✅ <b>All Clear!</b>\nসব Command এখন Public ✅`, { parse_mode: "HTML" });
    }

    return api.sendMessage(chatId, `⚠️ Unknown: ${sub}\n/paid add | del | list | clear`);
  }
};