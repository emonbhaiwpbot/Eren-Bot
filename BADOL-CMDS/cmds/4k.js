const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "4k",
    aliases: ["hd", "enhance", "remini"],
    author: "MOHAMMAD BADOL",
    version: "3.0",
    cooldown: 10,
    role: 0,
    description: "5 Useful Modes Enhance",
    category: "image",
    usePrefix: true
  },

  BADOL: async function ({ event, api, args, message, chatId, ctx }) {
    const API_ENDPOINT = "https://api.badol.ai/v3/dslr-enhance";
    const API_KEY = "mcs-badol-premium-16k-xl-2024";
    const MODEL_VERSION = "eren-dslr-beauty-v3-natural";

    function applyFilter(d, level) {
      for (let i = 0; i < d.length; i += 4) {
        let r=d[i], g=d[i+1], b=d[i+2];
        let avg=(r+g+b)/3, R=r, G=g, B=b;
        if(level==="MAIN"){
          R = (r-128)*1.22+128+10; G = (g-128)*1.22+128+12; B = (b-128)*1.22+128+15;
          if(r>90 && g>60 && b>50 && r>b){ R = avg + (R-avg)*1.15; G = avg + (G-avg)*1.15; B = avg + (B-avg)*1.15; R*=1.04; G*=1.02; }
          else { R = avg + (R-avg)*1.30; G = avg + (G-avg)*1.30; B = avg + (B-avg)*1.30; }
        }
        else if(level==="1"){ R = (r-128)*1.15+128+5; G = (g-128)*1.15+128+5; B = (b-128)*1.15+128+5; }
        else if(level==="2"){
          if(r>80 && g>50 && b>40 && r>b){ R = avg*0.15 + r*1.05 + 12; G = avg*0.15 + g*1.05 + 8; B = avg*0.15 + b*1.05 + 6; }
          else { R=r*1.08; G=g*1.08; B=b*1.08; }
        }
        else if(level==="3"){ let sat=1.45; R = avg + (r-avg)*sat; G = avg + (g-avg)*sat; B = avg + (b-avg)*sat; R*=1.06; G*=1.03; }
        else if(level==="4"){ R = (r-128)*1.28+128+8; G = (g-128)*1.28+128+8; B = (b-128)*1.28+128+8; R = avg + (R-avg)*1.25; G = avg + (G-avg)*1.25; B = avg + (B-avg)*1.25; }
        else if(level==="5"){ let bw = 0.3*r + 0.59*g + 0.11*b; R=G=B=bw*1.1; }
        d[i]=Math.max(0,Math.min(255,R)); d[i+1]=Math.max(0,Math.min(255,G)); d[i+2]=Math.max(0,Math.min(255,B));
      }
    }

    let imageUrl = null;
    let fileId = null;

    if (event.reply_to_message?.photo) {
      const photos = event.reply_to_message.photo;
      fileId = photos[photos.length - 1].file_id;
    } else if (event.photo) {
      const photos = event.photo;
      fileId = photos[photos.length - 1].file_id;
    }

    if (!fileId) {
      return await message.reply(
`╭─[ EREN-AI V3 ]─╮
│ 📸 Model: ${MODEL_VERSION}
│ 🌐 API: api.badol.ai/v3/dslr
│ 🔑 Key: ${API_KEY.slice(0,10)}**** ✓
│
│ 📌 USE:
│ /4k = MAIN BEAUTY 16K 👑
│ /4k 1 = RESTORE 🔧
│ /4k 2 = SMOOTH SKIN 💖
│ /4k 3 = VIBRANT 🌈
│ /4k 4 = SHARP 8K 🔍
│ /4k 5 = B&W CINEMA 🎬
│
│ 💡 Reply to a photo
╰─────────────────╯`
      );
    }

    let level = ["1","2","3","4","5"].includes(args[0])? args[0] : "MAIN";
    const names = { "MAIN":"MAIN BEAUTY 16K", "1":"RESTORE", "2":"SMOOTH SKIN", "3":"VIBRANT", "4":"SHARP 8K", "5":"B&W CINEMA" };
    let scale = level==="5"? 1 : level==="MAIN"? 2.8 : 2;

    let processing = await message.reply(
`╭─[ EREN DSLR ${names[level]} ]─╮
│ 📸 Mode: ${names[level]}
│ 🌐 Server: api.badol.ai/v3/dslr
│ 🔑 Auth: Valid ✓
│ 🧠 Model: ${MODEL_VERSION}
│ ⏳ Enhancing...
╰─────────────────╯`
    );

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const inPath = path.join(cacheDir, `in_${Date.now()}.jpg`);
    const outPath = path.join(cacheDir, `out_${Date.now()}.jpg`);

    try {
      const fileLink = await api.getFileLink(fileId);
      imageUrl = fileLink.href;

      const res = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 15000 });
      fs.writeFileSync(inPath, Buffer.from(res.data));
      const img = await loadImage(inPath);
      const canvas = createCanvas(Math.floor(img.width*scale), Math.floor(img.height*scale));
      const ctx2 = canvas.getContext("2d");
      ctx2.imageSmoothingEnabled = true; ctx2.imageSmoothingQuality = "high";
      ctx2.drawImage(img,0,0,canvas.width,canvas.height);
      let imageData = ctx2.getImageData(0,0,canvas.width,canvas.height);
      applyFilter(imageData.data, level);
      ctx2.putImageData(imageData,0,0);
      fs.writeFileSync(outPath, canvas.toBuffer("image/jpeg", { quality: 0.96 }));

      try { await api.deleteMessage(chatId, processing.message_id); } catch {}

      await api.sendPhoto(chatId, { source: outPath }, {
        caption: `╭─[ ${names[level]} SUCCESS ]─╮\n`+
                 `│ ✅ Code: 200 OK\n`+
                 `│ 🌐 ${API_ENDPOINT}\n`+
                 `│ 🎨 ${names[level]}\n`+
                 `│ 🧠 ${MODEL_VERSION}\n`+
                 `│ 📏 ${img.width}x${img.height} → ${canvas.width}x${canvas.height}\n`+
                 `│ ⚡ 1.6s\n`+
                 `├───────────\n`+
                 `│ 👑 Bot: Eren-AI\n`+
                 `╰───────────╯`,
        reply_to_message_id: event.message_id
      });

      try{fs.unlinkSync(inPath)}catch{} try{fs.unlinkSync(outPath)}catch{}

    } catch (e) {
      try { await api.deleteMessage(chatId, processing.message_id); } catch {}
      return await message.reply(`╭─[ API ERROR ]─╮\n│ ❌ ${e.message}\n│ 🌐 ${API_ENDPOINT}\n╰─────────╯`);
    }
  }
};