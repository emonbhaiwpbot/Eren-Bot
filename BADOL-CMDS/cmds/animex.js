const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "animex",
    aliases: ["animexx","xanime"],
    author: "MOHAMMAD BADOL",
    version: "1.0",
    role: 0,
    category: "image",
    description: "Anime Image Gen",
    usePrefix: true,
    cooldown: 5
  },

  BADOL: async function ({ event, api, args, message, chatId }) {
    const bot = api;
    try {
      if (!args[0]) {
        return message.reply(
`🎨 Animex Generator
━━━━━━━━━━━━━━━━
📌 Use: /animex prompt

Ex:
├ /animex a cute girl
├ /animex a cute girl with blue hair
├ /animex naruto uzumaki

🤖 Eren-AI`
        );
      }

      const prompt = args.join(" ") || "a cute girl";
      const wait = await message.reply(`⏳ Generating: ${prompt}`);

      const apiUrl = `https://sakura-apis.onrender.com/api/anime-nudity?prompt=${encodeURIComponent(prompt)}`;

      const res = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 120000 });

      // যদি JSON error আসে
      const contentType = res.headers['content-type'] || "";
      if (contentType.includes("application/json")) {
        const text = Buffer.from(res.data).toString();
        throw new Error(text.slice(0,300));
      }

      const imgPath = path.join(__dirname, `../data/anime_${Date.now()}.jpg`);
      if (!fs.existsSync(path.dirname(imgPath))) fs.mkdirSync(path.dirname(imgPath), {recursive:true});
      fs.writeFileSync(imgPath, res.data);

      await bot.deleteMessage(chatId, wait.message_id).catch(()=>{});
      await bot.sendPhoto(chatId, { source: fs.createReadStream(imgPath) }, {
        caption: `🎨 ${prompt}\n🤖 Eren-AI`
      });
      fs.unlinkSync(imgPath);

    } catch (e) {
      return message.reply(`❌ Failed: ${e.message}`);
    }
  }
};