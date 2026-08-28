const axios = require("axios");

module.exports = {
  config: {
    name: "prompt",
    aliases: ["promot", "getprompt", "describe"],
    author: "MOHAMMAD BADOL",
    version: "1.0",
    role: 0,
    category: "ai",
    description: "Get prompt from image",
    usePrefix: true,
    cooldown: 5
  },

  BADOL: async function ({ event, api, args, message, chatId }) {
    const bot = api;
    let imageUrl = "";

    try {
      if (event.reply_to_message?.photo) {
        const fid = event.reply_to_message.photo[event.reply_to_message.photo.length-1].file_id;
        const f = await bot.getFile(fid);
        imageUrl = `https://api.telegram.org/file/bot${bot.token}/${f.file_path}`;
      } else if (event.reply_to_message?.document) {
        const f = await bot.getFile(event.reply_to_message.document.file_id);
        imageUrl = `https://api.telegram.org/file/bot${bot.token}/${f.file_path}`;
      } else if (event.photo) {
        const fid = event.photo[event.photo.length-1].file_id;
        const f = await bot.getFile(fid);
        imageUrl = `https://api.telegram.org/file/bot${bot.token}/${f.file_path}`;
      } else if (args[0]?.startsWith("http")) {
        imageUrl = args[0];
      }

      if (!imageUrl) {
        return message.reply(
          `╭━❮ ✨ Image To Prompt ❯━╮\n`+
          `├‣ ছবিতে Reply দিয়ে /prompt লিখো\n`+
          `├‣ বা /prompt https://link.jpg\n`+
          `╰━═━═━═━═━═━═━╯`
        );
      }

      const waitMsg = await message.reply("⏳ Prompt বের করছি...");

      const apiUrl = `https://sakura-apis.onrender.com/api/prompt?imgUrl=${encodeURIComponent(imageUrl)}`;

      const res = await axios.get(apiUrl, { timeout: 90000 });

      console.log("Prompt API:", res.data);

      const prompt = res.data?.data?.prompt || res.data?.prompt;

      if (!prompt) {
        await bot.deleteMessage(chatId, waitMsg.message_id).catch(()=>{});
        return message.reply(`❌ Prompt পাই নাই!\n${JSON.stringify(res.data).slice(0,500)}`);
      }

      await bot.deleteMessage(chatId, waitMsg.message_id).catch(()=>{});

      const outMsg =
`╭━❮ ✨ Prompt Ready ❯━╮
├═━═━═━═━═━═━═━═━═━═
├‣ 📝 Prompt:
│
│ \`${prompt}\`
│
├‣ 👆 Tap To Copy Prompt!
├═━═━═━═━═━═━═━═━═━═
├‣ 🤖 Eren-AI
╰━═━═━═━═━═━═━═━╯`;

      await bot.sendMessage(chatId, outMsg, { parse_mode: "Markdown" });

    } catch (e) {
      console.log("Prompt Error:", e.message, e.response?.data);
      let err = e.message;
      if (e.response?.data) {
        try { err += `\n${JSON.stringify(e.response.data).slice(0,300)}`; } catch {}
      }
      return message.reply(`❌ Failed: ${err}\nRender Slow হলে 2 মিনিট পর Try করো!`);
    }
  }
};