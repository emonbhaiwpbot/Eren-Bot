const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const BG_IMAGES = [
  "https://drive.google.com/uc?export=download&id=1vQ8YcgfR0Hi1ov5e8Eh56qU5-eQz3RWN",
  "https://drive.google.com/uc?export=download&id=1vQ8YcgfR0Hi1ov5e8Eh56qU5-eQz3RWN"
];
const CACHE_DIR = path.join(process.cwd(), "cache");

function safeName(str, len=18){
  try{
    if(!str) return "Unknown";
    str=String(str).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
    if(!str) return "Unknown";
    const arr=Array.from(str);
    if(arr.length>len) return arr.slice(0,len).join("")+"…";
    return arr.join("");
  }catch{ return "Unknown"; }
}

async function getAvatarUrl(api, userId) {
  try {
    const p = await api.getUserProfilePhotos(userId);
    if (p && p.total_count > 0) {
      const f = p.photos[0].at(-1).file_id;
      const file = await api.getFile(f);
      return `https://api.telegram.org/file/bot${api.token}/${file.file_path}`;
    }
  } catch {}
  return null;
}

async function createBanner(d) {
  const W = 1416, H = 856;
  const c = createCanvas(W, H);
  const ctx = c.getContext("2d");

  try {
    const i = Math.floor(Math.random() * BG_IMAGES.length);
    const bgP = path.join(CACHE_DIR, `goodbye_bg_${i}.jpg`);
    if (!fs.existsSync(bgP)) {
      const r = await axios({ url: BG_IMAGES[i], method: "GET", responseType: "arraybuffer" });
      fs.writeFileSync(bgP, Buffer.from(r.data));
    }
    const bg = await loadImage(bgP);
    ctx.drawImage(bg, 0, 0, W, H);
  } catch {
    ctx.fillStyle = "#1a0000";
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = "rgba(50,0,0,0.6)";
  ctx.fillRect(0, 0, W, H);

  async function loadCircle(url, x, y, s, glow) {
    if (!url) return;
    try {
      const r = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
      const img = await loadImage(r.data);
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x - s - 15, y - s - 15, (s + 15) * 2, (s + 15) * 2);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, s + 4, 0, Math.PI * 2);
      ctx.strokeStyle = glow;
      ctx.lineWidth = 9;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 35;
      ctx.stroke();
      ctx.restore();
    } catch {}
  }

  await loadCircle(d.avatarUrl, 260, 320, 145, "#FF0000");
  await loadCircle(d.groupImage, 708, 340, 130, "#A020F0");
  await loadCircle(d.kickerAvatar, 1150, 320, 145, "#FFAA00");

  function drawLabel(x, y, t, n) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x - 110, y, 220, 75);
    ctx.strokeStyle = "#ff5555";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 110, y, 220, 75);
    ctx.restore();

    ctx.textAlign = "center";
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#ff8888";
    ctx.font = "bold 20px Arial";
    ctx.fillText(t, x, y + 22);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px Arial";
    const displayName = n? n : "Unknown";
    ctx.fillText((displayName.length > 14? displayName.substring(0, 14) + ".." : displayName).toUpperCase(), x, y + 50);
  }

  drawLabel(260, 520, "LEFT USER", d.name);
  drawLabel(708, 520, "GROUP", d.groupName);
  drawLabel(1150, 520, d.kickType, d.kickerName);

  ctx.textAlign = "center";
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 25;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 64px Arial";
  ctx.fillText("GOODBYE", W / 2, 110);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ff8888";
  ctx.font = "bold 28px Arial";
  ctx.fillText("WE WILL MISS YOU", W / 2, 170);

  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(W, 10);
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 5;
  ctx.shadowColor = "#FF0000";
  ctx.shadowBlur = 25;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, H - 10);
  ctx.lineTo(W, H - 10);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 22px Arial";
  ctx.fillText(`Eren-AI • ${d.member} Members Left`, W / 2, H - 25);

  fs.writeFileSync(d.output, c.toBuffer("image/png"));
}

module.exports = {
  config: {
    name: "leave",
    author: "MOHAMMAD BADOL",
    version: "4.0-PREMIUM-BOX-FINAL",
    description: "Goodbye kick+leave - Premium Box",
    eventType: "left_member"
  },
  BADOL: async function ({ event, api, leftMember, ctx }) {
    try {
      const telegramApi = api || ctx?.telegram || (global.bot && global.bot.telegram);
      const chat = event?.chat || ctx?.chat;
      if (!chat) return;

      const chatId = chat.id;
      const chatTitle = chat.title || "group";

      await fs.promises.mkdir(CACHE_DIR, { recursive: true });

      const member = leftMember || event?.left_chat_member || (event?.message && event.message.left_chat_member) || ctx?.left_chat_member;
      if (!member || member.is_bot) return;

      const rawName = member.first_name? (member.first_name + (member.last_name? ' ' + member.last_name : '')) : "User";
      const userName = safeName(rawName, 16);
      const botName = global.config.botInfo?.name || global.config.botName || 'Eren-AI';
      const safeGroup = safeName(chatTitle, 18);

      let kickerName = "Unknown", kickType = "LEFT";
      try {
        const actor = event?.from || ctx?.from;
        if (actor) {
          kickerName = safeName(actor.first_name || "Unknown", 12);
          if (actor.id === member.id) {
            kickType = "SELF LEAVE";
          } else {
            kickType = "KICKED BY";
          }
        }
      } catch {}

      let groupImageUrl = null;
      try {
        const cp = await telegramApi.getChat(chatId);
        if (cp && cp.photo) {
          const f = await telegramApi.getFile(cp.photo.big_file_id);
          groupImageUrl = `https://api.telegram.org/file/bot${telegramApi.token}/${f.file_path}`;
        }
      } catch {}

      const avatarUrl = await getAvatarUrl(telegramApi, member.id);
      const actorId = (event?.from?.id || ctx?.from?.id);
      const kickerAvatarUrl = actorId? await getAvatarUrl(telegramApi, actorId) : null;
      const bannerPath = path.join(CACHE_DIR, `goodbye_${member.id}.png`);

      let memberCount = 0;
      try {
        memberCount = await telegramApi.getChatMembersCount(chatId);
      } catch {}

      await createBanner({
        name: rawName,
        kickerName,
        groupName: chatTitle,
        member: memberCount,
        avatarUrl,
        kickerAvatar: kickerAvatarUrl,
        groupImage: groupImageUrl || avatarUrl,
        output: bannerPath,
        kickType
      });

      const bdTime = new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hour12: true });
      const reason = kickType === "KICKED BY"? `👢 Kicked: ${kickerName}` : `🚶 ${kickType}`;

      // ✅✅ PREMIUM BOX - SAME AS NOT APPROVED BOX
      const msg =
`╭─❖─〔 ${botName} 〕─❖─╮
│ 👋 𝐆𝐎𝐃𝐁𝐘𝐄 𝐅𝐀𝐌𝐈𝐋𝐘!
├──────────────────────┤
│ 👤 𝐍𝐚𝐦𝐞: ${userName}
│ 🆔 𝐈𝐃: ${member.id}
│ 🏠 𝐆𝐫𝐨𝐮𝐩: ${safeGroup}
│ ${reason}
│ ⏰ ${bdTime}
│ 🔢 𝐋𝐞𝐟𝐭: ${memberCount} Members
├──────────────────────┤
│ 😢 Miss you 🌙
╰─❖─〔 EREN-AI 〕─❖─╯`;

      await telegramApi.sendPhoto(chatId, { source: fs.createReadStream(bannerPath) }, { caption: msg });

      try { fs.unlinkSync(bannerPath); } catch {}
    } catch (e) {
      console.log("[LEAVE ERROR FIXED]", e);
    }
  }
};