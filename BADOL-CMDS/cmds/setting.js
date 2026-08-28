const fs = require('fs');
const path = require('path');

function safeName(str, len=28){
  try{
    if(!str) return "Unknown";
    str=String(str).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
    if(!str) return "Unknown";
    const arr=Array.from(str);
    if(arr.length>len) return arr.slice(0,len).join("")+"…";
    return arr.join("");
  }catch{ return "Unknown"; }
}

const PER_PAGE = 8;
const ROOT_DIR = process.cwd();

const CHANNEL_WHITELIST = [
  "-1002310865564",
  "-1009876543210",
];

if (!global.spamMuteMap) global.spamMuteMap = new Map();
if (!global._settingCache) global._settingCache = { gcmd: {}, time: 0 };

// ✅ FAST - MONGODB
async function isGroupAllowed(chatId, keyword) {
  try {
    if (Date.now() - global._settingCache.time > 10000) {
      if (global.db.getAllGroupCommands) {
        global._settingCache.gcmd = await global.db.getAllGroupCommands();
        global._settingCache.time = Date.now();
      }
    }
    const all = global._settingCache.gcmd || {};
    const gid = String(chatId);
    if (!all[gid]) return true;
    if (all[gid].mode!== "whitelist") return true;
    const enabled = all[gid].enabled.map(c=>c.toLowerCase());
    return enabled.includes(keyword.toLowerCase());
  } catch { return true; }
}

module.exports = {
  config: {
    name: "setting",
    aliases: ["settings", "panel", "control", "st", "config"],
    author: "MOHAMMAD BADOL",
    version: "8.1-MONGO-FIXED-RESTART",
    description: "Global + Per-Group AntiLink + SpamMute + 100% MongoDB",
    category: "admin",
    usePrefix: true,
    role: 2,
    cooldown: 2
  },

  BADOL: async function ({ api, chatId }) {
    if (!global.config.settings) global.config.settings = {};
    await sendMainPanel(api, chatId, null, null);
  },

  onCallback: async function ({ event, api, ctx }) {
    const query = event.callback_query || event;
    const data = event.data || query.data;
    const userId = event.from.id;
    const isAdmin = global.config.ownerInfo?.botAdmins?.includes(String(userId)) || String(userId) === "6954597258";
    if (!isAdmin) {
      try { await ctx.answerCbQuery("❌ Only Bot Admin!", { show_alert: true }); } catch {}
      return;
    }
    try { await ctx.answerCbQuery(); } catch {}
    if (data === "setting_main") return sendMainPanel(api, null, ctx, null);
    if (data === "setting_general_menu") return sendGeneralMenu(ctx);
    if (data === "setting_security_menu") return sendSecurityMenu(ctx);
    if (data === "setting_msg_menu") return sendMessageMenu(ctx);
    if (data === "setting_noop") return;

    if (data.startsWith("setting_toggle_")) {
      const key = data.replace("setting_toggle_", "");
      await toggleSetting(key);
      if (["prefixMode", "maintenance", "groupApproval", "dmApproval"].includes(key)) return sendGeneralMenu(ctx);
      if (["adminOnly", "banSystem", "cooldown", "antiSpam", "antilinkGlobal", "spamMuteGlobal"].includes(key)) return sendSecurityMenu(ctx);
      if (["autoReact", "alwaysEmoji", "welcome", "leave", "adminUnsend", "ignoreOld"].includes(key)) return sendMessageMenu(ctx);
    }

    if (data === "setting_role_menu" || data.startsWith("setting_role_page_")) {
      let page = 0;
      if (data.startsWith("setting_role_page_")) page = parseInt(data.replace("setting_role_page_", "")) || 0;
      const commands = [...global.badol.commands.values()];
      const uniqueCmds = [...new Map(commands.map(c => [c.config.name, c])).values()].sort((a,b)=>a.config.name.localeCompare(b.config.name));
      const totalPages = Math.ceil(uniqueCmds.length / PER_PAGE) || 1;
      const pageCmds = uniqueCmds.slice(page * PER_PAGE, (page+1)*PER_PAGE);
      const botName = safeName(global.config.botInfo?.name || "EREN-AI-BOT", 20);
      let keyboard = pageCmds.map(cmd => {
        const icon = cmd.config.role === 2? "🔒" : cmd.config.role === 1? "🛡️" : "🌐";
        return [{ text: `${icon} /${cmd.config.name} [${cmd.config.role??0}]`, callback_data: `setting_edit_${cmd.config.name}` }];
      });
      let navRow = [];
      if (page > 0) navRow.push({ text: "⬅️ Prev", callback_data: `setting_role_page_${page-1}` });
      navRow.push({ text: `📄 ${page+1}/${totalPages}`, callback_data: "setting_noop" });
      if (page < totalPages-1) navRow.push({ text: "Next ➡️", callback_data: `setting_role_page_${page+1}` });
      if (navRow.length) keyboard.push(navRow);
      keyboard.push([{ text: "⬅️ Back", callback_data: "setting_main" }]);
      const box = `╭─❖─〔 ${botName} 〕─❖─╮\n│ 🛡️ ROLE MANAGER\n╰─❖─〔 EREN-AI BOT 〕─❖─╯`;
      try { await ctx.editMessageText(box, { reply_markup: { inline_keyboard: keyboard } }); } catch {}
      return;
    }

    if (data.startsWith("setting_edit_")) {
      const cmdName = data.replace("setting_edit_", "");
      try {
        await ctx.editMessageText(`🛠️ EDIT: /${cmdName}`, {
          reply_markup: { inline_keyboard: [[{ text: "🌐 0 Everyone", callback_data: `setting_save_${cmdName}_0` }, { text: "🛡️ 1 G-Admin", callback_data: `setting_save_${cmdName}_1` }, { text: "🔒 2 Bot Admin", callback_data: `setting_save_${cmdName}_2` }], [{ text: "⬅️ Back", callback_data: "setting_role_menu" }]] }
        });
      } catch {}
      return;
    }

    if (data.startsWith("setting_save_")) {
      const parts = data.replace("setting_save_", "").split("_");
      const newRole = parseInt(parts.pop());
      const cmdName = parts.join("_");
      const cmd = global.badol.commands.get(cmdName);
      if (cmd) {
        cmd.config.role = newRole;
        try {
          let fp = path.join(__dirname, `${cmdName}.js`);
          if (fs.existsSync(fp)) {
            let content = fs.readFileSync(fp, 'utf8');
            content = content.replace(/role:\s*\d+/, `role: ${newRole}`);
            fs.writeFileSync(fp, content, 'utf8');
          }
        } catch {}
      }
      try { await ctx.editMessageText(`✅ /${cmdName} → Role ${newRole}`, { reply_markup: { inline_keyboard: [[{ text: "⬅️ Back", callback_data: "setting_role_menu" }]] } }); } catch {}
      return;
    }

    if (data === "setting_system_menu") {
      try {
        const totalUsers = (await global.db.getAllUsers()).length;
        const totalThreads = (await global.db.getAllThreads()).length;
        const cmdCount = new Set([...global.badol.commands.values()].map(c=>c.config.name)).size;
        await ctx.editMessageText(`📊 SYSTEM\nCmds: ${cmdCount} | Users: ${totalUsers} | Groups: ${totalThreads}`, { reply_markup: { inline_keyboard: [[{ text: "⬅️ Back", callback_data: "setting_main" }]] } });
      } catch {}
      return;
    }

    if (data === "setting_restart") { try { await ctx.editMessageText(`🔄 Restarting...`); } catch {} setTimeout(()=>process.exit(2), 1200); return; }
    if (data === "setting_clear_cache") { global.badol.threadAdmins.clear(); global.badol.cooldowns.clear(); global.spamMuteMap.clear(); global._settingCache = { gcmd: {}, time: 0 }; try { await ctx.answerCbQuery("✅ Cleared!"); } catch {} return sendMainPanel(null, null, ctx, "✅ Cache Cleared!\n\n"); }
    if (data === "setting_fixfiles") {
      try { await ctx.answerCbQuery("✅ MongoDB Mode - No Files Needed!"); } catch {}
      return;
    }
  },

  onChat: async function({ api, msg, chatId }) {
    if (!msg ||!chatId) return;
    if (msg.text && msg.text.startsWith("/")) return;
    if (!String(chatId).startsWith("-")) return;
    const fromId = msg.from?.id;
    if (!fromId) return;

    const settings = global.config.settings || {};
    let antilinkON = settings.antilinkGlobalEnabled === true;
    let spamMuteON = settings.spamMuteGlobalEnabled === true;

    if (!antilinkON &&!spamMuteON) return;

    const allowedAntilink = await isGroupAllowed(chatId, "antilink");
    const allowedSpam = await isGroupAllowed(chatId, "spammute") || await isGroupAllowed(chatId, "spam");
    if (!allowedAntilink) antilinkON = false;
    if (!allowedSpam) spamMuteON = false;

    if (!antilinkON &&!spamMuteON) return;

    const isBotAdmin = global.config.ownerInfo?.botAdmins?.includes(String(fromId)) || String(fromId) === "6954597258";
    if (isBotAdmin) return;

    let isGroupAdmin = false;
    try {
      const admins = await api.getChatAdministrators(chatId).catch(()=>[]);
      isGroupAdmin = admins.some(a => a.user.id === fromId);
    } catch {}
    if (isGroupAdmin) return;

    if (antilinkON) {
      try {
        const text = msg.text || msg.caption || "";
        const forwardChatId = msg.forward_from_chat? String(msg.forward_from_chat.id) : null;
        const senderChatId = msg.sender_chat? String(msg.sender_chat.id) : null;
        if (CHANNEL_WHITELIST.includes(forwardChatId) || CHANNEL_WHITELIST.includes(senderChatId)) return;
        if (msg.is_automatic_forward) return;
        const isForward =!!(msg.forward_from || msg.forward_from_chat || msg.forward_origin || msg.forward_date);
        const linkRegex = /(https?:\/\/|www\.|t\.me\/|telegram\.me\/|telegram\.dog\/|discord\.gg|bit\.ly)/i;
        const hasLinkEntity =!!(msg.entities && msg.entities.some(e => e.type === "url" || e.type === "text_link"));
        if (isForward || linkRegex.test(text) || hasLinkEntity) {
          const warnMsg = await api.sendMessage(chatId, `🚫 Link/Forward Not Allowed!\n👤 ${safeName(msg.from.first_name)} | 5s Delete!`, { reply_to_message_id: msg.message_id }).catch(()=>null);
          setTimeout(async () => {
            try { await api.deleteMessage(chatId, msg.message_id).catch(()=>{}); } catch {}
            try { if (warnMsg) await api.deleteMessage(chatId, warnMsg.message_id).catch(()=>{}); } catch {}
          }, 5000);
        }
      } catch (e) { console.log("AntiLink Error:", e.message); }
    }

    if (spamMuteON) {
      try {
        const key = `${chatId}_${fromId}`;
        const now = Date.now();
        let data = global.spamMuteMap.get(key);
        if (!data) data = { count: 1, firstTime: now };
        else {
          if (now - data.firstTime < 4000) data.count++;
          else { data.count = 1; data.firstTime = now; }
        }
        global.spamMuteMap.set(key, data);
        if (data.count > 5) {
          global.spamMuteMap.delete(key);
          const until = Math.floor(Date.now() / 1000) + 600;
          try {
            await api.restrictChatMember(chatId, fromId, { can_send_messages: false, can_send_media_messages: false, can_send_other_messages: false, can_add_web_page_previews: false, until_date: until });
            await api.sendMessage(chatId, `🔇 Anti-Spam Mute!\n👤 ${safeName(msg.from.first_name)} - 4s এ 5+ Spam!\n⏰ 10 মিনিট Mute!`, { reply_to_message_id: msg.message_id }).catch(()=>{});
            setTimeout(async () => {
              try { await api.restrictChatMember(chatId, fromId, { can_send_messages: true, can_send_media_messages: true, can_send_other_messages: true, can_add_web_page_previews: true }); } catch {}
            }, 600*1000);
          } catch (e) {
            if (e.message.includes("not enough rights")) {
              await api.sendMessage(chatId, `❌ Mute Fail: Bot কে Admin বানাও! Ban Permission দাও!`).catch(()=>{});
            }
          }
        }
      } catch (e) { console.log("SpamMute Error:", e.message); }
    }
  }
};

async function sendMainPanel(api, chatId, ctx, extra="") {
  const botName = safeName(global.config.botInfo?.name || "EREN-AI-BOT", 20);
  const text = `${extra||""}╭─❖─〔 ${botName} 〕─❖─╮\n│ ⚙️ CONTROL PANEL V8 MONGODB\n╰─❖─〔 EREN-AI BOT 〕─❖─╯`;
  const kb = { reply_markup: { inline_keyboard: [[{ text: "⚙️ General Settings", callback_data: "setting_general_menu" }], [{ text: "🔐 Security & Protection (Global)", callback_data: "setting_security_menu" }], [{ text: "💬 Message & Events", callback_data: "setting_msg_menu" }], [{ text: "🛡️ Role Manager", callback_data: "setting_role_menu" }], [{ text: "📊 System", callback_data: "setting_system_menu" }, { text: "🔄 Restart", callback_data: "setting_restart" }], [{ text: "🔧 Fix Files", callback_data: "setting_fixfiles" }, { text: "🗑️ Clear Cache", callback_data: "setting_clear_cache" }]] } };
  if (ctx) { try { await ctx.editMessageText(text, kb); } catch { await ctx.reply(text, kb).catch(()=>{}); } }
  else { await api.sendMessage(chatId, text, kb).catch(()=>{}); }
}

async function sendGeneralMenu(ctx) {
  const s = await getSettings();
  try {
    await ctx.editMessageText(`⚙️ GENERAL SETTINGS`, {
      reply_markup: { inline_keyboard: [[{ text: `${s.prefixMode? "🟢 ON" : "🔴 OFF"} - Prefix Mode`, callback_data: "setting_toggle_prefixMode" }], [{ text: `${s.maintenance? "🟢 ON" : "🔴 OFF"} - Maintenance`, callback_data: "setting_toggle_maintenance" }], [{ text: `${s.groupApproval? "🟢 ON" : "🔴 OFF"} - Group Approval`, callback_data: "setting_toggle_groupApproval" }], [{ text: `${s.dmApproval? "🟢 ON" : "🔴 OFF"} - DM Approval`, callback_data: "setting_toggle_dmApproval" }], [{ text: "⬅️ Back", callback_data: "setting_main" }]] }
    });
  } catch {}
}

async function sendSecurityMenu(ctx) {
  const s = await getSettings();
  try {
    await ctx.editMessageText(`🔐 SECURITY & PROTECTION (GLOBAL)\n📌 ON = সব গ্রুপে কাজ করবে\n📌 OFF = সব গ্রুপে বন্ধ\n🟢 = চালু | 🔴 = বন্ধ`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: `${s.adminOnly? "🟢 ON" : "🔴 OFF"} - Only Bot Admin Can Use Bot`, callback_data: "setting_toggle_adminOnly" }],
          [{ text: `${s.banSystem? "🟢 ON" : "🔴 OFF"} - Ban System`, callback_data: "setting_toggle_banSystem" }],
          [{ text: `${s.cooldown? "🟢 ON" : "🔴 OFF"} - Cooldown System`, callback_data: "setting_toggle_cooldown" }],
          [{ text: `${s.antiSpam? "🟢 ON" : "🔴 OFF"} - Anti-Spam (Bot Ignore - Old System)`, callback_data: "setting_toggle_antiSpam" }],
          [{ text: `${s.antilinkGlobal? "🟢 ON" : "🔴 OFF"} - Anti-Link: Link/Forward 5s Auto Delete (All Groups)`, callback_data: "setting_toggle_antilinkGlobal" }],
          [{ text: `${s.spamMuteGlobal? "🟢 ON" : "🔴 OFF"} - Spam Mute: 4s এ 5+ Msg = 10 Min Mute (All Groups)`, callback_data: "setting_toggle_spamMuteGlobal" }],
          [{ text: "⬅️ Back", callback_data: "setting_main" }]
        ]
      }
    });
  } catch {}
}

async function sendMessageMenu(ctx) {
  const s = await getSettings();
  try {
    await ctx.editMessageText(`💬 MESSAGE & EVENTS`, {
      reply_markup: { inline_keyboard: [[{ text: `${s.autoReact? "🟢 ON" : "🔴 OFF"} - Auto React`, callback_data: "setting_toggle_autoReact" }], [{ text: `${s.alwaysEmoji? "🟢 ON" : "🔴 OFF"} - Always Emoji`, callback_data: "setting_toggle_alwaysEmoji" }], [{ text: `${s.welcome? "🟢 ON" : "🔴 OFF"} - Welcome Message`, callback_data: "setting_toggle_welcome" }], [{ text: `${s.leave? "🟢 ON" : "🔴 OFF"} - Leave Message`, callback_data: "setting_toggle_leave" }], [{ text: "⬅️ Back", callback_data: "setting_main" }]] }
    });
  } catch {}
}

async function getSettings() {
  try {
    if (global.db?.getSettings) {
      const dbSettings = await global.db.getSettings();
      if (dbSettings && Object.keys(dbSettings).length>2) {
        return {
          prefixMode: dbSettings.prefixModeEnabled||false,
          maintenance: dbSettings.maintenanceEnabled||false,
          groupApproval: dbSettings.groupApprovalEnabled!==false,
          dmApproval: dbSettings.dmApprovalEnabled||false,
          adminOnly: dbSettings.adminOnlyMode||false,
          banSystem: dbSettings.banSystemEnabled!==false,
          cooldown: dbSettings.cooldownEnabled!==false,
          autoReact: dbSettings.autoReactionEnabled!==false,
          alwaysEmoji: dbSettings.alwaysEmojiEnabled!==false,
          welcome: dbSettings.welcomeMessageEnabled!==false,
          leave: dbSettings.leaveMessageEnabled!==false,
          antiSpam: dbSettings.antiSpamEnabled||false,
          antilinkGlobal: dbSettings.antilinkGlobalEnabled===true,
          spamMuteGlobal: dbSettings.spamMuteGlobalEnabled===true,
        };
      }
    }
  } catch {}
  const st = global.config?.settings||{};
  return {
    prefixMode: st.prefixModeEnabled||false,
    maintenance: st.maintenanceEnabled||false,
    groupApproval: st.groupApprovalEnabled!==false,
    dmApproval: st.dmApprovalEnabled||false,
    adminOnly: st.adminOnlyMode||false,
    banSystem: st.banSystemEnabled!==false,
    cooldown: st.cooldownEnabled!==false,
    autoReact: st.autoReactionEnabled!==false,
    alwaysEmoji: st.alwaysEmojiEnabled!==false,
    welcome: st.welcomeMessageEnabled!==false,
    leave: st.leaveMessageEnabled!==false,
    antiSpam: st.antiSpamEnabled||false,
    antilinkGlobal: st.antilinkGlobalEnabled===true,
    spamMuteGlobal: st.spamMuteGlobalEnabled===true,
  };
}

async function toggleSetting(key) {
  if (!global.config.settings) global.config.settings = {};
  const s = global.config.settings;
  const cur = await getSettings();
  const map = {
    prefixMode: () => { s.prefixModeEnabled =!cur.prefixMode; },
    maintenance: () => { s.maintenanceEnabled=!cur.maintenance; },
    groupApproval: () => { s.groupApprovalEnabled=!cur.groupApproval; },
    dmApproval: () => { s.dmApprovalEnabled=!cur.dmApproval; },
    adminOnly: () => { s.adminOnlyMode=!cur.adminOnly; s.onlyAdmin=!cur.adminOnly; },
    banSystem: () => { s.banSystemEnabled=!cur.banSystem; },
    cooldown: () => { s.cooldownEnabled=!cur.cooldown; },
    autoReact: () => s.autoReactionEnabled =!cur.autoReact,
    alwaysEmoji: () => s.alwaysEmojiEnabled =!cur.alwaysEmoji,
    welcome: () => s.welcomeMessageEnabled =!cur.welcome,
    leave: () => s.leaveMessageEnabled =!cur.leave,
    antiSpam: () => s.antiSpamEnabled =!cur.antiSpam,
    antilinkGlobal: () => s.antilinkGlobalEnabled =!cur.antilinkGlobal,
    spamMuteGlobal: () => s.spamMuteGlobalEnabled =!cur.spamMuteGlobal,
  };
  if (map[key]) map[key]();

  // ✅✅✅ MAIN FIX - SAVE TO BOTH MONGO + FILE + GLOBAL
  try {
    if (global.db?.updateSettings) await global.db.updateSettings(s);
    // Also save to config file for restart persistence
    const configPath = path.join(ROOT_DIR, "config.json");
    if(fs.existsSync(configPath)){
      try{
        const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if(!cfg.settings) cfg.settings = {};
        Object.assign(cfg.settings, s);
        fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
      }catch{}
    }
    // Save to BADOL/settings.json if exists
    const settingsPath = path.join(ROOT_DIR, "BADOL", "settings.json");
    if(fs.existsSync(settingsPath)){
      try{ fs.writeFileSync(settingsPath, JSON.stringify(s, null, 2)); }catch{}
    }
  } catch(e){ console.log("Save settings error:", e.message); }
}