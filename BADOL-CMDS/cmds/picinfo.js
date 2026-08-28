const axios = require("axios");

module.exports = {
  config: {
    name: "picinfo",
    aliases: ["picsize", "pinfo"],
    author: "MOHAMMAD BADOL",
    version: "1.0 CONVERTED",
    cooldown: 5,
    role: 0,
    description: "Get image resolution, size, and direct download link",
    category: "utility",
    usePrefix: true
  },

  BADOL: async function ({ event, api, args, message }) {
    try {
      const msg = event;
      const chatId = msg.chat.id;

      // রিপ্লাই চেক
      if (!msg.reply_to_message || !msg.reply_to_message.photo) {
        return await message.reply("⚠️ কোনো **ছবিতে Reply** দিয়ে /pic লিখো!");
      }

      const photoArray = msg.reply_to_message.photo;
      const latestPhoto = photoArray[photoArray.length - 1];
      const fileId = latestPhoto.file_id;

      // ফাইল ইনফো নেওয়া
      const fileInfo = await api.getFile(fileId);
      
      // টোকেন বের করা (তোমার বটের config থেকে)
      const token = global.config.botToken || global.config.token || (global.CONFIG && global.CONFIG.BOT_TOKEN);
      if (!token) return await message.reply("❌ Bot token পাওয়া যায়নি!");

      const downloadUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;

      const bytes = fileInfo.file_size || 0;
      const size = bytes >= 1048576 
        ? `${(bytes / 1048576).toFixed(2)} MB` 
        : `${(bytes / 1024).toFixed(2)} KB`;

      // টাইম
      const options = {
        timeZone: global.config.timezone || 'Asia/Dhaka',
        hour12: true,
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      };
      const currentTime = new Intl.DateTimeFormat('en-US', options).format(new Date());

      const response = `
📸 *PHOTO ANALYZER (ULTIMATE)*
━━━━━━━━━━━━━━━━━━━━━
📏 *Resolution:* \`${latestPhoto.width} × ${latestPhoto.height}\` px
📦 *File Size:* \`${size}\`
⏰ *Time:* \`${currentTime}\`
👤 *Credit:* \`MOHAMMAD BADOL\`
━━━━━━━━━━━━━━━━━━━━━
🔗 [Direct Download Link](${downloadUrl})
      `.trim();

      await api.sendMessage(chatId, response, {
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id
      });

    } catch (error) {
      console.log("Pic Error:", error.message);
      await message.reply("❌ ছবির ডাটা আনতে সমস্যা হয়েছে!");
    }
  }
};