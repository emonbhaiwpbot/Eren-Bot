const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const BG_IMAGES = [
  "https://drive.google.com/uc?export=download&id=1vQ8YcgfR0Hi1ov5e8Eh56qU5-eQz3RWN",
  "https://drive.google.com/uc?export=download&id=1vQ8YcgfR0Hi1ov5e8Eh56qU5-eQz3RWN"
];
const CACHE_DIR = path.join(process.cwd(), "cache");

async function getAvatarUrl(api, userId){
  try{
    const photos = await api.getUserProfilePhotos(userId);
    if(photos.total_count>0){
      const fileId = photos.photos[0].at(-1).file_id;
      const file = await api.getFile(fileId);
      return `https://api.telegram.org/file/bot${api.token}/${file.file_path}`;
    }
  }catch{}
  return null;
}

async function createBanner(data){
  const width=1416,height=856;
  const canvas=createCanvas(width,height);
  const ctx=canvas.getContext("2d");
  const randomIndex = Math.floor(Math.random()*BG_IMAGES.length);
  const selectedBG = BG_IMAGES[randomIndex];
  try{
    const bgPath=path.join(CACHE_DIR,`welcome_bg_${randomIndex}.jpg`);
    if(!fs.existsSync(bgPath)){
      const res=await axios({url:selectedBG,method:"GET",responseType:"arraybuffer"});
      fs.writeFileSync(bgPath, Buffer.from(res.data));
    }
    const bg=await loadImage(bgPath);
    ctx.drawImage(bg,0,0,width,height);
  }catch{ ctx.fillStyle="#111827"; ctx.fillRect(0,0,width,height); }

  const userX=260,userY=320,userSize=145, groupX=708,groupY=340,groupSize=130, adderX=1150,adderY=320,adderSize=145, labelY=520,labelW=220,labelH=75;

  async function loadCircleImage(url,x,y,size,glow){
    if(!url) return;
    try{
      const res=await axios.get(url,{responseType:"arraybuffer",timeout:10000});
      const img=await loadImage(res.data);
      ctx.save(); ctx.beginPath(); ctx.arc(x,y,size,0,Math.PI*2); ctx.clip();
      ctx.drawImage(img,x-size-15,y-size-15,(size+15)*2,(size+15)*2); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(x,y,size+4,0,Math.PI*2);
      ctx.strokeStyle=glow; ctx.lineWidth=9; ctx.shadowColor=glow; ctx.shadowBlur=35; ctx.stroke(); ctx.restore();
    }catch{}
  }
  await loadCircleImage(data.avatarUrl,userX,userY,userSize,"#00F5FF");
  await loadCircleImage(data.groupImage,groupX,groupY,groupSize,"#A020F0");
  await loadCircleImage(data.adderAvatar,adderX,adderY,adderSize,"#00FF88");

  function drawLabel(x,y,title,name){
    ctx.save(); ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.fillRect(x-labelW/2,y,labelW,labelH);
    ctx.strokeStyle="#00eaff"; ctx.lineWidth=2; ctx.strokeRect(x-labelW/2,y,labelW,labelH); ctx.restore();
    ctx.textAlign="center"; ctx.shadowColor="#00ffff"; ctx.shadowBlur=15;
    ctx.fillStyle="#00eaff"; ctx.font="bold 20px Arial"; ctx.fillText(title,x,y+22);
    ctx.shadowBlur=0; ctx.fillStyle="#fff"; ctx.font="bold 22px Arial";
    ctx.fillText((name.length>14?name.substring(0,14)+"..":name).toUpperCase(),x,y+50);
  }
  drawLabel(userX,labelY,"NEW USER",data.name);
  drawLabel(groupX,labelY,"GROUP",data.groupName);
  drawLabel(adderX,labelY,"ADDED BY",data.adderName);
  ctx.textAlign="center"; ctx.shadowColor="#00ffff"; ctx.shadowBlur=20;
  ctx.fillStyle="#fff"; ctx.font="bold 64px Arial"; ctx.fillText("WELCOME",width/2,110);
  ctx.shadowBlur=0; ctx.fillStyle="#00eaff"; ctx.font="bold 28px Arial"; ctx.fillText("THANKS FOR JOINING",width/2,170);
  ctx.beginPath(); ctx.moveTo(0,10); ctx.lineTo(width,10); ctx.strokeStyle="#00E5FF"; ctx.lineWidth=5; ctx.shadowColor="#00E5FF"; ctx.shadowBlur=25; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,height-10); ctx.lineTo(width,height-10); ctx.stroke();
  ctx.shadowBlur=0; ctx.textAlign="center"; ctx.fillStyle="#FFFFFF"; ctx.font="bold 22px Arial";
  ctx.fillText(`EREN-AI-BOT • Total: ${data.member} Members`, width/2, height-25);
  fs.writeFileSync(data.output, canvas.toBuffer("image/png"));
}

module.exports = {
  config: {
    name: "welcome",
    author: "MOHAMMAD BADOL",
    version: "3.1-PREMIUM-BOX-FINAL",
    description: "Welcome new members with canvas + approval system",
    eventType: "new_member"
  },

  BADOL: async function ({ event, api, message, newMembers, ctx }) {
    try {
      const chatTitle = event.chat.title || 'this group';
      const chatId = event.chat.id;
      await fs.promises.mkdir(CACHE_DIR,{recursive:true});

      let groupImageUrl = null;
      try{
        const chatPhoto = await api.getChat(chatId);
        if(chatPhoto.photo){
          const file = await api.getFile(chatPhoto.photo.big_file_id);
          groupImageUrl = `https://api.telegram.org/file/bot${api.token}/${file.file_path}`;
        }
      }catch{}

      for (const member of newMembers) {
        if (member.is_bot && member.id === (await api.getMe()).id) {
          const addedBy = event.from;
          const addedByName = addedBy.first_name + (addedBy.last_name? ' ' + addedBy.last_name : '');
          const addedByUsername = addedBy.username? `@${addedBy.username}` : 'No username';

          if (global.config.groupApproval?.enabled) {
            const isAdmin = global.config.adminUID.includes(String(addedBy.id));
            if (!isAdmin) {
              const approvalId = await global.db.addApproval('group', {
                chatId: String(chatId), chatName: chatTitle,
                addedBy: String(addedBy.id), addedByName: addedByName
              });
              await message.send(`⏳ Thank you for adding me!\n\nThis bot requires admin approval.\n📩 Approval request sent.\n\n👤 Added by: ${addedByName}\n🆔 Approval ID: ${approvalId}`);
              for (const adminId of global.config.adminUID) {
                try {
                  await api.sendMessage(adminId,
                    `🔔 New Group Approval Request\n\n📂 Group: ${chatTitle}\n🆔 Chat ID: ${chatId}\n👤 Added by: ${addedByName}\n📝 Username: ${addedByUsername}\n🆔 User ID: ${addedBy.id}`,
                    { reply_markup: { inline_keyboard: [[{ text: '✅ Approve', callback_data: `approve_group_${approvalId}` },{ text: '❌ Reject', callback_data: `reject_group_${approvalId}` }]] } }
                  );
                } catch {}
              }
              continue;
            } else {
              await global.db.updateThread(String(chatId), { approved: true });
            }
          } else {
            await global.db.updateThread(String(chatId), { approved: true });
          }

          const safeTitle = String(chatTitle).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
          const displayTitle = safeTitle.length>28? safeTitle.slice(0,28)+"…" : safeTitle;
          const botName = global.config.botInfo?.name || global.config.botName || 'EREN-AI-BOT';
          const prefix = global.config.botInfo?.prefix || global.config.prefix || '/';

          const botWelcomeMessage =
`╭─❖─〔 ${botName} 〕─❖─╮
│ 🤖 𝐇𝐄𝐋𝐎 ${displayTitle.toUpperCase()}!
├──────────────────────┤
│ ✅ 𝐓𝐡𝐚𝐧𝐤 𝐲𝐨𝐮 𝐟𝐨𝐫 𝐚𝐝𝐝𝐢𝐧𝐠 𝐦𝐞!
│
│ 👤 𝐀𝐝𝐝𝐞𝐝 𝐛𝐲: ${addedByName}
│ 📝 ${addedByUsername}
│ ⚙️ 𝐏𝐫𝐞𝐟𝐢𝐱: ${prefix}
│ 💡 ${prefix}help for all cmds
╰─❖─〔 EREN-AI-BOT 〕─❖─╯`;

          await api.sendMessage(chatId, botWelcomeMessage);
          continue;
        }

        if (member.is_bot) continue;

        const userName = member.first_name + (member.last_name? ' ' + member.last_name : '');
        const userId = member.id;
        const username = member.username? `@${member.username}` : 'No username';
        const adderName = event.from?.first_name || "Unknown";

        let avatarUrl = await getAvatarUrl(api, userId);
        let adderAvatarUrl = await getAvatarUrl(api, event.from?.id);

        const bannerPath = path.join(CACHE_DIR, `welcome_${userId}.png`);
        await createBanner({
          name: userName, adderName: adderName, groupName: chatTitle,
          member: await api.getChatMembersCount(chatId).catch(()=>0),
          avatarUrl: avatarUrl, adderAvatar: adderAvatarUrl,
          groupImage: groupImageUrl || avatarUrl,
          output: bannerPath
        });

        const bdTime = new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hour12: true });
        const bdDate = new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric" });

        const welcomeMessage = `╔══════════════════════╗
║ ✨ WELCOME FAMILY ✨ ║
╚══════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━━┓
┃ 👤 𝗡𝗮𝗺𝗲 : ${userName}
┃ 🆔 𝗨𝗜𝗗 : ${userId}
┃ 📝 𝗨𝘀𝗲𝗿 : ${username}
┃ 🏠 𝗚𝗿𝗼𝘂𝗽 : ${chatTitle}
┃ ➕ 𝗔𝗱𝗱𝗲𝗱 : ${adderName}
┃ ⏰ 𝗧𝗶𝗺𝗲 : ${bdTime}
┃ 📅 𝗗𝗮𝘁𝗲 : ${bdDate}
┗━━━━━━━━━━━━━━━━━━━━━┛

🌟 আমাদের পরিবারে আপনাকে স্বাগতম 🌟`;

        await api.sendPhoto(chatId, {source: fs.createReadStream(bannerPath)}, {caption: welcomeMessage});
        try{ fs.unlinkSync(bannerPath); }catch{}
      }
    } catch (error) {
      global.log.error('Error in welcome event:', error);
      console.log(error);
    }
  }
};