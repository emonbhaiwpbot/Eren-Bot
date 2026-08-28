// ✅ GEMINI V2 - TELEGRAM CONVERTED - TEXT + IMAGE
const axios = require("axios");

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

module.exports = {
  config: {
    name: "gemini",
    aliases: ["genimi", "gemi"],
    version: "2.0-TG",
    author: "MOHAMMAD BADOL",
    role: 0,
    prefix: true,
    cooldown: 3,
    description: "Ask Gemini AI (Text or Image)",
    category: "ai"
  },

  BADOL: async function ({ api, chatId, event, args, message }) {
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return await api.sendMessage(chatId,
        `╭─[ GEMINI AI ]─╮\n│ ❌ দয়া করে একটি প্রশ্ন লিখুন।\n│ Ex: /gemini hi kemon acho?\n╰─────────────────\n🤖 BADOL-BOT\n👑 DEV: MOHAMMAD BADOL`
      );
    }

    let baseApi;
    try {
      const res = await axios.get(nix, { timeout: 10000 });
      baseApi = res.data?.api;
      if (!baseApi) throw new Error("API missing");
    } catch (e) {
      return await api.sendMessage(chatId, `╭─[ ERROR ]─╮\n│ ❌ API কনফিগ লোড করা যায়নি।\n╰─────────────────`);
    }

    const textApi = `${baseApi}/gemini`;
    const visionApi = `${baseApi}/gemini-pro`;

    let imageUrl = null;

    try {
      // 1. Reply photo check
      if (event.reply_to_message?.photo) {
        const photos = event.reply_to_message.photo;
        const fileId = photos[photos.length - 1].file_id;
        const file = await api.getFile(fileId);
        imageUrl = `https://api.telegram.org/file/bot${api.token}/${file.file_path}`;
      }
      // 2. Direct photo with caption
      else if (event.photo) {
        const photos = event.photo;
        const fileId = photos[photos.length - 1].file_id;
        const file = await api.getFile(fileId);
        imageUrl = `https://api.telegram.org/file/bot${api.token}/${file.file_path}`;
      }
      // 3. Document as image
      else if (event.reply_to_message?.document?.mime_type?.includes("image")) {
        const fileId = event.reply_to_message.document.file_id;
        const file = await api.getFile(fileId);
        imageUrl = `https://api.telegram.org/file/bot${api.token}/${file.file_path}`;
      }
    } catch (e) {
      console.log("Image get error:", e.message);
    }

    await api.sendChatAction(chatId, "typing").catch(()=>{});

    try {
      const apiUrl = imageUrl
        ? `${visionApi}?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`
        : `${textApi}?prompt=${encodeURIComponent(prompt)}`;

      const response = await axios.get(apiUrl, { timeout: 30000 });
      const reply = response.data?.response;

      if (!reply) throw new Error("No response");

      let msg =
`╭─[ GEMINI AI ✨ ]─╮
│ ${reply}
╰─────────────────
🤖 BADOL-BOT
👑 DEV: MOHAMMAD BADOL`;

      // Telegram 4096 limit split
      if (msg.length > 4000) {
        const chunks = msg.match(/[\s\S]{1,4000}/g);
        for (const chunk of chunks) {
          await api.sendMessage(chatId, chunk);
        }
      } else {
        await api.sendMessage(chatId, msg);
      }

    } catch (err) {
      console.error(err.message);
      return await api.sendMessage(chatId,
        `╭─[ FAILED ]─╮\n│ ⚠️ Gemini API থেকে উত্তর পাওয়া যায়নি।\n│ ${err.message}\n╰─────────────────`
      );
    }
  }
};