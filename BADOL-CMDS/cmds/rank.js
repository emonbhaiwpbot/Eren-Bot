const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// ✅ YOUR FONT FOLDER
const fontsDir = path.join(__dirname, 'BADOL');
let FONT_FAMILY = 'Arial';
let FONTS_LOADED = [];

try {
  if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });
  
  // তোর ৩টা ফন্ট
  const myFonts = ['Badol_1.ttf', 'Badol_2.ttf', 'Badol_3.ttf'];
  
  myFonts.forEach(file => {
    const fontPath = path.join(fontsDir, file);
    if (fs.existsSync(fontPath)) {
      const fontName = path.parse(file).name; // Badol_1
      registerFont(fontPath, { family: fontName });
      FONTS_LOADED.push(fontName);
      console.log(`[FONT] Loaded: ${fontName}`);
    }
  });
  
  // প্রথম ফন্টটাই Main হবে (Bangla এর জন্য Badol_1)
  if (FONTS_LOADED.length > 0) FONT_FAMILY = FONTS_LOADED[0];
  
  console.log(`[RANK] Using Font: ${FONT_FAMILY} | Total: ${FONTS_LOADED.length}`);
} catch (e) {
  console.log('Font Load Error:', e.message);
}

module.exports = {
  config: {
    name: "rank",
    aliases: ["level", "lvl"],
    author: "MOHAMMAD BADOL",
    version: "2.5-CUSTOM-FONT",
    cooldown: 5,
    role: 0,
    description: "Rank with custom fonts",
    category: "game",
    usePrefix: true
  },

  onChat: async function({ event, api }) {
    try {
      const senderID = event.from?.id;
      if (!senderID || senderID == api.botInfo?.id) return;
      if (!event.text) return;
      let userData = await global.db.getUser(senderID).catch(()=>null);
      if (!userData) return;
      userData.exp = (userData.exp || 0) + Math.floor(Math.random() * 6) + 5;
      userData.msgCountPrivate = (userData.msgCountPrivate || 0) + 1;
      const needed = userData.level * 100 || 100;
      if (userData.exp >= needed) {
        userData.level = (userData.level || 0) + 1;
        userData.exp = 0;
        const card = await genCard(senderID, userData, event.from, api, true);
        if (card) {
          await api.sendPhoto(event.chat.id, { source: fs.createReadStream(card) }, {
            caption: `┏━[ LEVEL UP ]━┓\n┃ 🎉 ${event.from.first_name} -> Lv.${userData.level}\n┗━━━━━━━━━━━━┛`
          }).catch(()=>{});
          try { fs.unlinkSync(card); } catch {}
        }
      }
      await global.db.setUser(senderID, userData).catch(()=>{});
    } catch {}
  },

  BADOL: async function ({ event, api, message, userId, ctx }) {
    try {
      const text = (event.text || '').toLowerCase();
      if (text.includes('top')) {
        const allUsers = await global.db.getAllUsers();
        const sorted = allUsers.sort((a,b) => (b.level || 0) - (a.level || 0) || (b.exp || 0) - (a.exp || 0)).slice(0, 10);
        if (sorted.length === 0) return message.reply("❌ No data!");
        let msg = `┏━[ TOP 10 RANK ]━┓\n`;
        for (let i = 0; i < sorted.length; i++) {
          const u = sorted[i];
          const name = (u.name || 'User').slice(0, 15);
          const medal = i==0?'🥇':i==1?'🥈':i==2?'🥉':`${i+1}.`;
          msg += `┃ ${medal} ${name} - Lv.${u.level} (${u.exp} XP)\n`;
        }
        msg += `┗━━━━━━━━━━━━━━━┛`;
        return message.reply(msg);
      }

      let targetUserId = userId;
      let targetUser = event.from;
      if (event.reply_to_message) {
        targetUserId = event.reply_to_message.from.id;
        targetUser = event.reply_to_message.from;
      }
      const userData = await global.db.getUser(targetUserId);
      if (!userData) return message.reply("❌ No data found!");
      const cardPath = await genCard(targetUserId, userData, targetUser, api, false);
      if (cardPath) {
        const expNeeded = userData.level * 100 || 100;
        const totalMsg = (userData.msgCountPrivate || 0) + Object.values(userData.msgCountThread || {}).reduce((a,b)=>a+b,0);
        const caption =
`┏━[ RANK INFO ]━┓
┃ 👤 ${targetUser.first_name}
┃ ⭐ Lv.${userData.level} | ✨ ${userData.exp}/${expNeeded} XP
┃ 💰 $${userData.money || 0} | 💬 ${totalMsg} Msgs
┃ 🎨 Font: ${FONT_FAMILY}
┗━━━━━━━━━━━━━━━┛`;
        await api.sendPhoto(event.chat.id, { source: fs.createReadStream(cardPath) }, { caption, reply_to_message_id: event.message_id }).catch(async () => {
          await ctx.replyWithPhoto({ source: fs.createReadStream(cardPath) }, { caption }).catch(()=>{});
        });
        try { fs.unlinkSync(cardPath); } catch {}
      }
    } catch (e) { message.reply(`❌ ${e.message}`); }
  }
};

async function genCard(targetID, userData, targetUser, api, isLevelUp) {
  return new Promise(async (resolve) => {
    try {
      const canvas = createCanvas(800, 300);
      const ctx = canvas.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 800, 300);
      grad.addColorStop(0, "#0f0c29");
      grad.addColorStop(1, "#302b63");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 300);
      ctx.strokeStyle = "#00f2ff";
      ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, 788, 288);

      try {
        const photos = await api.getUserProfilePhotos(targetID, { limit: 1 });
        if (photos.photos && photos.photos.length > 0) {
          const photo = photos.photos[0][photos.photos[0].length - 1];
          const file = await api.getFile(photo.file_id);
          const fileUrl = `https://api.telegram.org/file/bot${global.config.token}/` + file.file_path;
          const res = await axios.get(fileUrl, { responseType: "arraybuffer" });
          const buffer = Buffer.from(res.data);
          const img = await loadImage(buffer);
          ctx.save();
          ctx.beginPath();
          ctx.arc(120, 150, 75, 0, Math.PI*2);
          ctx.clip();
          ctx.drawImage(img, 45, 75, 150, 150);
          ctx.restore();
          ctx.strokeStyle = "#00f2ff";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(120, 150, 77, 0, Math.PI*2);
          ctx.stroke();
        } else throw new Error('no photo');
      } catch {
        ctx.fillStyle = "#00f2ff";
        ctx.beginPath();
        ctx.arc(120, 150, 75, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `bold 60px ${FONT_FAMILY}, Arial`;
        ctx.textAlign = "center";
        ctx.fillText(targetUser.first_name.charAt(0).toUpperCase(), 120, 170);
        ctx.textAlign = "left";
      }

      const expNeeded = userData.level * 100 || 100;
      const percent = Math.min((userData.exp / expNeeded) * 100, 100);

      ctx.fillStyle = "#fff";
      ctx.font = `bold 26px ${FONT_FAMILY}, Arial`;
      ctx.fillText(targetUser.first_name.slice(0, 18), 220, 55);

      ctx.fillStyle = "#00f2ff";
      ctx.font = `bold 22px ${FONT_FAMILY}, Arial`;
      ctx.fillText(`LVL ${userData.level}`, 220, 85);

      ctx.fillStyle = "#ffd93d";
      ctx.font = `18px ${FONT_FAMILY}, Arial`;
      ctx.fillText(`${userData.exp}/${expNeeded} XP`, 220, 110);

      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(220, 130, 500, 28);
      ctx.fillStyle = "#00ff88";
      ctx.fillRect(220, 130, (500*percent)/100, 28);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.floor(percent)}%`, 470, 148);
      ctx.textAlign = "left";

      ctx.fillStyle = "#ccc";
      ctx.font = `16px ${FONT_FAMILY}, Arial`;
      ctx.fillText(`Money: $${userData.money || 0}`, 220, 185);
      const totalMsg = (userData.msgCountPrivate || 0) + Object.values(userData.msgCountThread || {}).reduce((a,b)=>a+b,0);
      ctx.fillText(`Messages: ${totalMsg}`, 220, 210);

      if (isLevelUp) {
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("LEVEL UP!", 470, 250);
      }

      const dir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const p = path.join(dir, `rank_${targetID}_${Date.now()}.png`);
      fs.writeFileSync(p, canvas.toBuffer("image/png"));
      resolve(p);
    } catch (e) { console.log('Gen Error:', e.message); resolve(null); }
  });
}