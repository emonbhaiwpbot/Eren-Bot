const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "zombe",
    aliases: ["zombie", "zombieai"],
    author: "MOHAMMAD BADOL",
    version: "2.0-DIRECT-IMAGE",
    role: 0,
    category: "fun",
    description: "Zombie filter - direct image",
    usePrefix: true,
    cooldown: 5
  },

  BADOL: async function ({ event, api, args, message, chatId }) {
    const bot = api;
    let imageUrl = "";
    let mode = "2";

    try {
      // Mode: /zombie 1, /zombie 2, /zombie 1 https://...
      let urlArg = null;
      for (let a of args) {
        if (a.startsWith("http")) urlArg = a;
        else if (!isNaN(a) && (a=="1"||a=="2"||a=="3")) mode = a;
      }

      if (event.reply_to_message?.photo) {
        const fileId = event.reply_to_message.photo[ event.reply_to_message.photo.length -1 ].file_id;
        const file = await bot.getFile(fileId);
        imageUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      } else if (event.reply_to_message?.document?.mime_type?.startsWith("image/")) {
        const file = await bot.getFile(event.reply_to_message.document.file_id);
        imageUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      } else if (event.photo) {
        const fileId = event.photo[event.photo.length -1].file_id;
        const file = await bot.getFile(fileId);
        imageUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      } else if (urlArg) {
        imageUrl = urlArg;
      }

      if (!imageUrl) {
        return message.reply(
          `🧟 কিভাবে Use করবি:\n\n`+
          `1️⃣ ছবি পাঠা, তারপর ওই ছবিতে Reply দিয়ে লিখ: /zombie\n`+
          `2️⃣ বা /zombe 1 (Mode 1)\n`+
          `3️⃣ বা /zombe https://i.ibb.co/xxx.jpg\n\n`+
          `❌ User এর মেসেজে Reply না, ছবিতে Reply!`
        );
      }

      const waitMsg = await message.reply(`⏳ 🧟 Zombie Mode ${mode} বানাচ্ছি... API Slow হলে 30s লাগবে!`);

      const apiUrl = `https://sakura-apis.onrender.com/api/zombie?url=${encodeURIComponent(imageUrl)}&mode=${mode}`;
      console.log("Zombie API:", apiUrl);

      // 🔥 DIRECT IMAGE DOWNLOAD - arraybuffer
      const res = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 120000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      // যদি JSON Error হয়
      const ct = res.headers['content-type'] || "";
      if (ct.includes("application/json")) {
        const txt = Buffer.from(res.data).toString();
        console.log("JSON Error:", txt);
        await bot.deleteMessage(chatId, waitMsg.message_id).catch(()=>{});
        return message.reply(`❌ API Error:\n${txt.slice(0,300)}`);
      }

      console.log("Image Type:", ct, "Size:", res.data.length);

      const ext = ct.includes("webp")? "webp" : ct.includes("png")? "png" : "jpg";
      const imgPath = path.join(__dirname, `../data/zombie_${Date.now()}.${ext}`);
      if (!fs.existsSync(path.dirname(imgPath))) fs.mkdirSync(path.dirname(imgPath), { recursive: true });
      fs.writeFileSync(imgPath, res.data);

      await bot.deleteMessage(chatId, waitMsg.message_id).catch(()=>{});

      await bot.sendPhoto(chatId, { source: fs.createReadStream(imgPath) }, {
        caption: `╭━❮ 🧟 Zombie Done ❯━╮\n├‣ Mode: ${mode}\n├‣ 🤖 Eren-AI\n╰━═━═━═━═━═━╯`
      });

      fs.unlinkSync(imgPath);

    } catch (e) {
      console.log("Zombie Error:", e.message);
      return message.reply(`❌ Failed: ${e.message}\n\n👉 ছবিতে Reply দিয়ে আবার দে!`);
    }
  }
};