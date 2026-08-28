module.exports = {
  config: {
    name: "rmkey",
    aliases: ["removekey", "clearkey"],
    author: "MOHAMMAD BADOL",
    version: "1.0",
    description: "বটের নিচের স্থায়ী বাটন বা কীবোর্ড রিমুভ করে",
    category: "general",
    usePrefix: true,
    cooldown: 3,
    role: 1,
  },

  BADOL: async function ({ api, chatId, message }) {
    try {
      await api.sendMessage(chatId, "🧹 <b>নিচের স্থায়ী বাটনগুলো সফলভাবে রিমুভ করা হয়েছে!</b>", {
        parse_mode: "HTML",
        reply_markup: {
          remove_keyboard: true
        }
      });
    } catch (err) {
      await message.reply(`❌ ত্রুটি: ${err.message}`);
    }
  }
};
