// ✅ BADOL TG BOT - MP3 CONVERTER - CONVERTED V1.2 - BADOL
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { alldown } = require('nayan-media-downloaders');

module.exports = {
    config: {
        name: "mp3",
        aliases: ["audio", "music"],
        version: "1.2-TG",
        author: "MOHAMMAD BADOL",
        role: 0,
        cooldown: 10,
        usePrefix: true,
        description: "ভিডিও বা লিংক থেকে MP3 নামান",
        category: "media",
        usage: "/mp3 [URL] অথবা ভিডিওতে রিপ্লাই"
    },

    BADOL: async function({ api, chatId, args, message, ctx }) {
        const badolDir = path.join(__dirname, 'Badol');
        if (!fs.existsSync(badolDir)) fs.mkdirSync(badolDir, { recursive: true });

        // ✅ Typing
        try { await api.sendChatAction(chatId, 'upload_voice'); } catch {}

        const waitingMsg = await api.sendMessage(chatId, "⏳ আপনার অডিও প্রসেসিং হচ্ছে, একটু অপেক্ষা করুন...");

        try {
            let audioSourceUrl = "";
            let fileName = `Badol_Audio_${Date.now()}.mp3`;
            const mp3Path = path.join(badolDir, fileName);

            // ✅ FIXED REPLY DETECTION - সব জায়গা থেকে
            const replied = ctx?.message?.reply_to_message || message?.reply_to_message || message?.message?.reply_to_message;
            let replyVideo = null;

            if (replied) {
                // Telegram video / document / audio / voice
                if (replied.video) replyVideo = replied.video;
                else if (replied.document && (replied.document.mime_type?.includes('video') || replied.document.mime_type?.includes('audio'))) {
                    replyVideo = replied.document;
                } else if (replied.audio) replyVideo = replied.audio;
                else if (replied.voice) replyVideo = replied.voice;
            }

            // 1. Video তে Reply দিলে
            if (replyVideo) {
                const fileId = replyVideo.file_id;
                const file = await api.getFile(fileId);
                audioSourceUrl = `https://api.telegram.org/file/bot${api.token}/${file.file_path}`;
            }
            // 2. Link দিলে
            else if (args && args.length > 0) {
                const url = args[0];
                if (!url.startsWith('http')) {
                    throw new Error("Invalid URL");
                }
                const res = await alldown(url);
                if (res.status && res.data && res.data.audio) {
                    audioSourceUrl = res.data.audio;
                } else if (res.data?.url) {
                    audioSourceUrl = res.data.url;
                }
            }

            if (audioSourceUrl) {
                const response = await axios({
                    method: 'get',
                    url: audioSourceUrl,
                    responseType: 'stream',
                    timeout: 60000
                });

                const writer = fs.createWriteStream(mp3Path);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                // ✅ Send as Audio
                await api.sendAudio(chatId, { source: fs.createReadStream(mp3Path) }, {
                    caption: "✅ Success!\nConverted by Eren-AI",
                    reply_to_message_id: message?.message_id || ctx?.message?.message_id
                });

                if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
            } else {
                await api.sendMessage(chatId,
                    `╭─⊰ Eren-AI ⊱─╮\n`+
                    `│ ❌ কোনো ভিডিও বা লিংক পাইনি!\n│\n`+
                    `│ 💡 নিয়ম:\n`+
                    `│ • ভিডিওতে Reply দিয়ে /mp3\n`+
                    `│ • /mp3 [youtube/fb/tiktok link]\n`+
                    `╰──────────────────────╯`
                );
            }

        } catch (error) {
            console.error("MP3 Error:", error.message);
            await api.sendMessage(chatId, `❌ সমস্যা হয়েছে!\n${error.message}\n\nলিংক সঠিক কিনা চেক করুন।`);
        } finally {
            try { await api.deleteMessage(chatId, waitingMsg.message_id); } catch {}
        }
    }
};