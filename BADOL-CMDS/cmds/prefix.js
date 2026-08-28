const fs = require('fs');
const path = require('path');

function toBoldItalic(text) {
    const map = {
        "a": "𝚊", "b": "𝚋", "c": "𝚌", "d": "𝚍", "e": "𝚎", "f": "𝚏", "g": "𝚐", "h": "𝚑", "i": "𝚒", "j": "𝚓", "k": "𝚔", "l": "𝚕", "m": "𝚖", "n": "𝚗", "o": "𝚘", "p": "𝚙", "q": "𝚚", "r": "𝚛", "s": "𝚜", "t": "𝚝", "u": "𝚞", "v": "𝚟", "w": "𝚠", "x": "𝚡", "y": "𝚢", "z": "𝚣",
        "A": "𝙰", "B": "𝙱", "C": "𝙲", "D": "𝙳", "E": "𝙴", "F": "𝙵", "G": "𝙶", "H": "𝙷", "I": "𝙸", "J": "𝙹", "K": "𝙺", "L": "𝙻", "M": "𝙼", "N": "𝙽", "O": "𝙾", "P": "𝙿", "Q": "𝚀", "R": "𝚁", "S": "𝚂", "T": "𝚃", "U": "𝚄", "V": "𝚅", "W": "𝚆", "X": "𝚇", "Y": "𝚈", "Z": "𝚉",
        "0": "𝟶", "1": "𝟷", "2": "𝟸", "3": "𝟹", "4": "𝟺", "5": "𝟻", "6": "𝟼", "7": "𝟽", "8": "𝟾", "9": "𝟿"
    };
    return String(text).split('').map(c => map[c] || c).join('');
}

module.exports = {
  config: {
    name: "prefix",
    aliases: ["setprefix"],
    author: "MOHAMMAD BADOL",
    version: "6.2-FIXED",
    cooldown: 3,
    role: 0,
    description: "Everyone view, only owner can change",
    category: "admin",
    usePrefix: false
  },

  BADOL: async function ({ event, api, args, message, chatId }) {
    try {
      const imgURL = "https://drive.google.com/uc?export=download&id=1Jl0cK5iH5lLgMPRz0Jp02c0V1FIwDyMu";
      const sendWithImg = async (txt) => {
        try { return await api.sendPhoto(event.chat.id, imgURL, { caption: txt }); }
        catch(e){ return message.reply(txt); }
      };

      const threadId = String(chatId || event.chat.id);
      const userId = String(event.from.id);
      const cfg = global.config;

      let ownerList = [];
      if (cfg.adminUID) ownerList = ownerList.concat(cfg.adminUID);
      if (cfg.authorId) ownerList = ownerList.concat(cfg.authorId);
      if (cfg.ownerId) ownerList = ownerList.concat(cfg.ownerId);
      ownerList = [...new Set(ownerList.map(String))];
      const isOwner = ownerList.includes(userId);

      let realArgs = [...args];
      if (realArgs[0] && realArgs[0].toLowerCase() === 'prefix') realArgs = realArgs.slice(1);

      if (!realArgs[0]) {
        let currentPrefix = cfg.prefix;
        try {
          const thread = await global.db.getThread(threadId);
          if (thread?.customPrefix) currentPrefix = thread.customPrefix;
        } catch(e){}
        let msg = `╭━❮ ⚙️ ${toBoldItalic("PREFIX")} ❯━╮\n`;
        msg += `├‣ ${toBoldItalic("Global")}: ${cfg.prefix}\n`;
        msg += `├‣ ${toBoldItalic("Current")}: ${currentPrefix}\n`;
        msg += `├─━─━━──━─━─━\n`;
        msg += `├‣ ${toBoldItalic("Bot")}: ${toBoldItalic("EREN-AI")}\n`;
        msg += `╰━──━─━─━━─━─━❍`;
        return sendWithImg(msg);
      }

      if (!isOwner) {
        return sendWithImg(
          `╭━❮ ❌ ${toBoldItalic("NO PERMISSION")} ❯━╮\n` +
          `├‣ ${toBoldItalic("Only owner can change")}\n` +
          `╰━──━─━─━━─━─━❍`
        );
      }

      const newPrefix = realArgs[0];
      if (['reset','delete','remove'].includes(newPrefix.toLowerCase())) {
        await global.db.updateThread(threadId, { customPrefix: null });
        // ✅ CACHE CLEAR
        if(global._threadCache) global._threadCache.time = 0;
        return sendWithImg(`╭━❮ ✅ ${toBoldItalic("RESET")} ❯━╮\n├‣ ${toBoldItalic("Back to")}: ${cfg.prefix}\n╰━──━─━─━━─━─━❍`);
      }

      if (newPrefix.length > 3) {
        return sendWithImg(`╭━❮ ❌ ${toBoldItalic("FAILED")} ❯━╮\n├‣ ${toBoldItalic("Max 3 chars allowed")}\n╰━──━─━─━━─━─━❍`);
      }

      await global.db.updateThread(threadId, { customPrefix: newPrefix });
      // ✅ CACHE CLEAR - সাথে সাথে কাজ করবে
      if(global._threadCache) global._threadCache.time = 0;
      if(global._noticeCache) global._noticeCache.time = 0;

      return sendWithImg(`╭━❮ ✅ ${toBoldItalic("UPDATED")} ❯━╮\n├‣ ${toBoldItalic("New Prefix")}: ${newPrefix}\n├‣ ${toBoldItalic("Saved MongoDB")}\n╰━──━─━─━━─━─━❍`);

    } catch (error) {
      return message.reply(`╭━❮ ❌ ERROR ❯━╮\n├‣ ${error.message}\n╰━──━─━─━━─━─━❍`);
    }
  }
};