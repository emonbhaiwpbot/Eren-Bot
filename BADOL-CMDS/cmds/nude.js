const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "nude",
    aliases: ["nude1", "sakura"],
    author: "MOHAMMAD BADOL",
    version: "1.0",
    role: 0,
    category: "image",
    description: "AI Image Gen - Eren-ai",
    usePrefix: true,
    cooldown: 5
  },

  BADOL: async function ({ event, api, args, message, chatId }) {
    const bot = api;
    try {
      if (!args[0]) {
        return message.reply(
`🌸 Eren AI Image Generator
━━━━━━━━━━━━━━━━
📌 Use: /nude your prompt

Ex:
├ /nude a cute girl
├ /nude anime girl
━━━━━━━━━━━━━━━━
🤖 Eren-AI`
        );
      }

      const prompt = args.join(" ");
      const wait = await message.reply(`⏳ Generating: ${prompt}`);

      // Sakura API Link
      const apiUrl = `https://sakura-apis.onrender.com/api/nudity?prompt=${encodeURIComponent(prompt)}`;

      const res = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 60000 });
      const imgPath = path.join(__dirname, `../data/sakura_${Date.now()}.jpg`);
      
      if (!fs.existsSync(path.dirname(imgPath))) {
        fs.mkdirSync(path.dirname(imgPath), { recursive: true });
      }
      
      fs.writeFileSync(imgPath, res.data);

      await bot.deleteMessage(chatId, wait.message_id).catch(() => {});
      await bot.sendPhoto(chatId, { source: fs.createReadStream(imgPath) }, {
        caption: `🌸 Prompt: ${prompt}\n🤖 Eren-AI`
      });
      
      // ফাইল পাঠানো শেষ হলে লোকাল ফোল্ডার থেকে রিমুভ করে দেওয়া
      fs.unlinkSync(imgPath);

    } catch (e) {
      return message.reply(`❌ Error: ${e.message}`);
    }
  }
};
