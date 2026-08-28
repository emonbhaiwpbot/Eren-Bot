// BADOL/notices.js - V10 FINAL FIXED - MONGODB SINGLE SOURCE - OFF BUG 100% FIXED
const fs = require('fs');
const path = require('path');

const LOCK_ID = "6954597258";
const ALL_OWNER_IDS = ["6954597258", "8036137477"];
const BOT_NAME = "Eren-AI";
const OWNER1_NAME = "B4D9L";
const OWNER1_URL = "https://t.me/B4D9L_007";
const OWNER2_NAME = "M9U";
const OWNER2_URL = "https://t.me/M9U_007";

// ✅ FAST CACHE - 3 sec
if (!global._noticeCache) global._noticeCache = { approved: [], adminOnly: false, time: 0 };

function getConfig() {
  const cfg = global.config;
  if (!cfg) return { adminUID: [], onlyAdmin: false, prefix: '/', ownerName: BOT_NAME, ownerId: LOCK_ID, ownerIds: ALL_OWNER_IDS, botName: BOT_NAME, botUsername: "ErenAi1Bot", bannedUsers: [], bannedGroups: [] };
  const mainOwner = cfg.ownerInfo?.mainOwner;
  let ownerIds = ALL_OWNER_IDS;
  let ownerId = LOCK_ID;
  if (Array.isArray(mainOwner)) {
    ownerIds = mainOwner.map(o => String(o.id));
    ownerId = String(mainOwner[0]?.id || LOCK_ID);
  } else if (mainOwner?.id) {
    ownerId = String(mainOwner.id);
    ownerIds = [ownerId];
  }
  const botAdmins = cfg.ownerInfo?.botAdmins || cfg.adminUID || [];
  const allAdmins = [...new Set([...botAdmins.map(String),...ownerIds.map(String)])];
  return {
    adminUID: allAdmins,
    ownerIds: ownerIds,
    prefix: cfg.botInfo?.prefix || cfg.prefix || '/',
    botName: cfg.botInfo?.name || BOT_NAME,
    ownerName: BOT_NAME,
    ownerId: ownerId,
    botUsername: cfg.botInfo?.username || "ErenAi1Bot",
    bannedUsers: cfg.banSystem?.bannedUsers || [],
    bannedGroups: cfg.banSystem?.bannedGroups || []
  };
}

function getButtons(cfg){
  return {
    inline_keyboard: [
      [{text:`🤖 ${BOT_NAME}`, url:`https://t.me/${cfg.botUsername.replace('@','')}`}]
    ]
  };
}

function getOwnerContactButtons(cfg){
  return {
    inline_keyboard: [
      [
        {text:`👑 ${OWNER1_NAME}`, url: OWNER1_URL},
        {text:`👑 ${OWNER2_NAME}`, url: OWNER2_URL}
      ],
      [
        {text:`🤖 ${BOT_NAME}`, url:`https://t.me/${cfg.botUsername.replace('@','')}`}
      ]
    ]
  };
}

function safeName(str, len=20){
  try{
    if(!str) return "Unknown";
    str=String(str).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
    if(!str) return "Unknown";
    const arr=Array.from(str);
    if(arr.length>len) return arr.slice(0,len).join("")+"…";
    return arr.join("");
  }catch{ return "Group"; }
}

function isBotAdminCheck(userId) {
  const cfg = getConfig();
  const uid = String(userId);
  return cfg.adminUID.map(String).includes(uid) || cfg.ownerIds.map(String).includes(uid) || uid === LOCK_ID;
}

// ✅ FIXED - SINGLE SOURCE - ONLY THREADS.approved === true
async function getApprovedGroups() {
  try {
    if (Date.now() - global._noticeCache.time < 3000 && Array.isArray(global._noticeCache.approved)) {
      return global._noticeCache.approved;
    }
    if (global.db?.getAllThreads) {
      const all = await global.db.getAllThreads();
      const approved = [];
      for (const t of all) {
        if (t.approved === true) {
          approved.push(String(t.id || t.threadID || t.threadId));
        }
      }
      global._noticeCache.approved = [...new Set(approved)];
      global._noticeCache.time = Date.now();
      return global._noticeCache.approved;
    }
    return global._noticeCache.approved || [];
  } catch { return global._noticeCache.approved || []; }
}

function getAdminOnlyState() {
  try {
    if (global._noticeCache.adminOnly!== undefined && Date.now() - global._noticeCache.time < 10000) {
      return global._noticeCache.adminOnly;
    }
    const st = global.config?.settings || {};
    if (st.adminOnlyMode!== undefined) return st.adminOnlyMode === true;
    if (st.onlyAdmin!== undefined) return st.onlyAdmin === true;
    return false;
  } catch { return false; }
}

function getGroupApprovalEnabled() {
  const st = global.config?.settings || {};
  if (st.groupApprovalEnabled!== undefined) return st.groupApprovalEnabled!== false;
  if (st.groupApproval && typeof st.groupApproval.enabled!== 'undefined') return st.groupApproval.enabled!== false;
  return true;
}

function getDMApprovalEnabled() {
  const st = global.config?.settings || {};
  if (st.dmApprovalEnabled!== undefined) return st.dmApprovalEnabled === true;
  if (st.dmApproval && typeof st.dmApproval.enabled!== 'undefined') return st.dmApproval.enabled === true;
  return false;
}

module.exports = {
  async checkBan({ api, chatId, userId, text, prefix, event }) {
    if (!global.db && getConfig().bannedUsers.length === 0) return { blocked: false };
    if (!userId) return { blocked: false };
    try {
      const cfg = getConfig();
      const uid = String(userId);
      const raw = String(text||"").trim().toLowerCase();
      let _cmd = raw.split(' ')[0] || "";
      if(_cmd.startsWith(prefix)) _cmd = _cmd.slice(prefix.length);
      if(_cmd.startsWith('/')) _cmd = _cmd.slice(1);
      if(_cmd.includes('@')) _cmd = _cmd.split('@')[0];
      if(["request","req","appeal"].includes(_cmd)) return { blocked: false };
      if (cfg.bannedUsers.includes(uid)) {
        let reason = 'Violation'; try{ if(global.config?.banSystem?.bannedUsersReason?.[uid]) reason = global.config.banSystem.bannedUsersReason[uid]; }catch{} reason = reason.length > 20? reason.slice(0,20)+'..' : reason;
        const msg = `╭━❮ ${BOT_NAME} ❯━╮\n├‣ ⛔ BANNED USER\n├‣ 📝 Reason: ${reason}\n├‣ 🚫 Status: Blocked\n├‣ 💡 Fix: ${prefix}request\n╰━━━━━━━━━━━━╯`;
        await api.sendMessage(chatId, msg, { reply_to_message_id: event.message_id, reply_markup: getOwnerContactButtons(cfg) }).catch(()=>{});
        return { blocked: true, silent: false };
      }
      if (global.db) {
        const isBanned = await global.db.isUserBanned(String(userId));
        if (!isBanned) return { blocked: false };
        if (!text.startsWith(prefix) &&!text.startsWith('/')) return { blocked: true, silent: true };
        let reason = 'Violation'; try{ const info = await global.db.getBanInfo?.(String(userId)) || {}; if(info.reason) reason = info.reason; }catch{} reason = reason.length > 20? reason.slice(0,20)+'..' : reason;
        const msg = `╭━❮ ${BOT_NAME} ❯━╮\n├‣ ⛔ BANNED USER\n├‣ 📝 Reason: ${reason}\n╰━━━━━━━━━━━━╯`;
        await api.sendMessage(chatId, msg, { reply_to_message_id: event.message_id, reply_markup: getOwnerContactButtons(cfg) }).catch(()=>{});
        return { blocked: true, silent: false };
      }
      return { blocked: false };
    } catch { return { blocked: false }; }
  },

  checkPermission({ command, userId, chatId }) {
    const cfg = getConfig();
    const uid = String(userId);
    const role = command.config.role || 0;
    const isOwner = cfg.ownerIds.map(String).includes(uid) || uid === LOCK_ID;
    const st = global.config?.settings || {};
    const onlyAdminEnabled = st.onlyAdmin === true || st.adminOnlyMode === true || getAdminOnlyState();
    if (onlyAdminEnabled &&!cfg.adminUID.map(String).includes(uid) &&!isOwner) {
      if (getAdminOnlyState()) return { blocked: true, silent: true, msg: null };
      return { blocked: true, msg: `╭━❮ ${BOT_NAME} ❯━╮\n├‣ 🔒 ADMIN ONLY MODE\n├‣ ⚠️ Admin Lock Active\n╰━━━━━━━━━━━━╯`, keyboard: getButtons(cfg) };
    }
    if (role === 0) return { blocked: false };
    if (role === 2) {
      if (!isOwner) return { blocked: true, msg: `╭━❮ ${BOT_NAME} ❯━╮\n├‣ 👑 OWNER ONLY\n├‣ 🔐 Only Owner Access\n╰━━━━━━━━━━━━╯`, keyboard: getOwnerContactButtons(cfg) };
      return { blocked: false };
    }
    if (role === 1) {
      if (isOwner) return { blocked: false };
      if (cfg.adminUID.map(String).includes(uid)) return { blocked: false };
      try {
        if (chatId && global.badol?.threadAdmins?.has(String(chatId))) {
          const cached = global.badol.threadAdmins.get(String(chatId));
          if (cached?.admins?.map(String).includes(uid)) return { blocked: false };
          if (Array.isArray(cached) && cached.map(String).includes(uid)) return { blocked: false };
        }
      } catch {}
      return { blocked: true, msg: `╭━❮ ${BOT_NAME} ❯━╮\n├‣ 🔰 GROUP ADMIN ONLY\n├‣ 🛡️ Need Admin Power\n╰━━━━━━━━━━━━╯`, keyboard: getButtons(cfg) };
    }
    return { blocked: false };
  },

  checkCooldown({ command, userId }) {
    const st = global.config?.settings || {};
    const cooldownEnabled = st.cooldownEnabled!== false && st.cooldown?.enabled!== false;
    if (!cooldownEnabled) return { blocked: false };
    const cfg = getConfig();
    const key = `${userId}_${command.config.name}`;
    const now = Date.now();
    const amount = (command.config.cooldown || 0) * 1000;
    if (global.badol.cooldowns.has(key)) {
      const exp = global.badol.cooldowns.get(key) + amount;
      if (now < exp) {
        const left = ((exp-now)/1000).toFixed(1);
        return { blocked: true, msg: `╭━❮ ${BOT_NAME} ❯━╮\n├‣ ⏳ COOLDOWN: ${left}s\n├‣ 💤 Slow Down!\n╰━━━━━━━━━━━━╯`, keyboard: getButtons(cfg) };
      }
    }
    global.badol.cooldowns.set(key, now);
    setTimeout(()=>global.badol.cooldowns.delete(key), amount);
    return { blocked: false };
  },

  checkAdminOnly(userId) { const enabled = getAdminOnlyState(); if (!enabled) return { blocked: false }; if (!isBotAdminCheck(userId)) return { blocked: true, silent: true, msg: null }; return { blocked: false }; },
  checkMaintenance(userId) { const st = global.config?.settings || {}; const enabled = st.maintenanceEnabled === true || st.maintenance?.enabled === true; if (!enabled) return { blocked: false }; if (!isBotAdminCheck(userId)) return { blocked: true, silent: true, msg: null, keyboard: getButtons(getConfig()) }; return { blocked: false }; },

  async checkGroupApproval(chatId, commandName, chatTitle) {
    const enabled = getGroupApprovalEnabled();
    if (!enabled) return { blocked: false };
    const isGroup = String(chatId).startsWith("-");
    if (!isGroup) return { blocked: false };
    const approvedList = await getApprovedGroups();
    const isApproved = approvedList.includes(String(chatId));
    const allowCmds = ["approve", "setting", "group", "gclist", "gcapprove", "gapprove", "request", "req"];
    if (!isApproved &&!allowCmds.includes(commandName)) {
      const displayName = safeName(chatTitle || "This Group", 20);
      const cfg = getConfig();
      const box = `╭━❮ ${BOT_NAME} ❯━╮\n├‣ ❌ NOT APPROVED\n├‣ 📛 Group: ${displayName}\n├‣ 🆔 ID: ${String(chatId).slice(-8)}\n├‣ ⚠️ Approval Needed!\n╰━━━━━━━━━━━━╯`;
      return { blocked: true, silent: false, msg: box, keyboard: getOwnerContactButtons(cfg) };
    }
    return { blocked: false };
  },

  checkDMApproval(userId, chatType, commandName) {
    const enabled = getDMApprovalEnabled();
    if (!enabled) return { blocked: false };
    if (chatType!== 'private') return { blocked: false };
    const allowCmds = ["request", "req", "appeal", "start"];
    if (!isBotAdminCheck(userId) &&!allowCmds.includes(commandName)) return { blocked: true, silent: true, msg: null };
    return { blocked: false };
  },

  getNotFoundNotice(commandName, prefix) {
    const cfg = getConfig();
    return { msg: `╭━❮ ${BOT_NAME} ❯━╮\n├‣ ❌ CMD NOT FOUND\n├‣ 🔍 "${commandName.slice(0,12)}"\n├‣ 💡 Try: ${prefix}help\n╰━━━━━━━━━━━━╯`, keyboard: getButtons(cfg) };
  },

  isBanSystemEnabled() { const st = global.config?.settings || {}; return st.banSystemEnabled!== false && st.banSystem?.enabled!== false; },
  getAdminOnlyState, getGroupApprovalEnabled, getDMApprovalEnabled, getApprovedGroups
};