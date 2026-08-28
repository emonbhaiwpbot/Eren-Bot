// ✅ BADOL TG BOT - HIJLA BANNER - CONVERTED FOR TELEGRAM - V4.7

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BG_URL = "https://drive.google.com/uc?export=view&id=1eGp9HgMYVrwhwXltOirZAEk5xQiqRoE4";

module.exports = {
    config: {
        name: "hijla",
        version: "4.7-TG",
        author: "MOHAMMAD BADOL",
        cooldown: 10,
        role: 0,
        prefix: true,
        description: "Hijla banner with Telegram DP",
        category: "fun",
        usage: "/hijla (reply)",
        aliases: []
    },

    BADOL: async function({ api, chatId, args, message, ctx }) {
        const restrictedId = "61591265887748";

        const hijlaMessages = [
            "এই যে দেখুন নতুন হিজলা! 😂",
            "সাবধান! এলাকা কাঁপানো হিজলা হাজির! 💃",
            "হিজলা হওয়ার শখ মিটলো তো? 😈",
            "সবাই হাততালি দেন, নতুন হিজলা পাওয়া গেছে! 👏",
            "ওর আসল রূপটা দেখুন, একদম অরিজিনাল হিজলা! 🤡",
            "আজ থেকে তুই হিজলা বাহিনীর সদস্য! 🤣",
            "ইশ! হিজলাটা তো দেখি খুব কিউট! 💅",
            "গোপন খবর ফাঁস! হিজলা ধরা পড়লো! 🔥"
        ];
        const randomMsg = hijlaMessages[Math.floor(Math.random() * hijlaMessages.length)];

        // ✅ TG REPLY DETECTION
        const replied = ctx?.message?.reply_to_message || message?.reply_to_message;
        let targetId = null;
        let targetName = "Target";

        if (replied) {
            targetId = String(replied.from.id);
            targetName = replied.from.first_name || "Target";
        } else if (args[0] &&!isNaN(args[0])) {
            targetId = String(args[0]);
        }

        if (!targetId) {
            return await api.sendMessage(chatId, "⚠️ Please reply to someone!", { reply_to_message_id: message.message_id });
        }

        if (targetId == restrictedId) {
            return await api.sendMessage(chatId, "❌ You don't have permission!", { reply_to_message_id: message.message_id });
        }

        const waitMsg = await api.sendMessage(chatId, "⏳ Processing...", { reply_to_message_id: message.message_id });

        try {
            // ✅ BG Load
            const bgResponse = await axios.get(BG_URL, { responseType: 'arraybuffer', timeout: 15000 });
            const bgImg = await loadImage(Buffer.from(bgResponse.data));

            const canvas = createCanvas(360, 360);
            const ctx2 = canvas.getContext('2d');
            ctx2.drawImage(bgImg, 0, 0, 360, 360);

            // ✅ TG PROFILE PIC GET
            async function getTgProfilePic(uid) {
                try {
                    const photos = await api.getUserProfilePhotos(uid, { limit: 1 });
                    if (photos.total_count > 0) {
                        const fileId = photos.photos[0][0].file_id;
                        const file = await api.getFile(fileId);
                        const url = `https://api.telegram.org/file/bot${api.token}/${file.file_path}`;
                        const res = await axios.get(url, { responseType: 'arraybuffer' });
                        return Buffer.from(res.data);
                    }
                } catch {}
                // Fallback - Blank avatar
                return null;
            }

            const posX = 180;
            const posY = 80;
            const sizeR = 40;

            const drawProfile = async (buffer, x, y, r, borderColor) => {
                if (!buffer) return;
                const img = await loadImage(buffer);
                ctx2.save();
                ctx2.beginPath();
                ctx2.arc(x, y, r, 0, Math.PI * 2, true);
                ctx2.closePath();
                ctx2.clip();
                ctx2.drawImage(img, x - r, y - r, r * 2, r * 2);
                ctx2.restore();
                ctx2.strokeStyle = borderColor;
                ctx2.lineWidth = 4;
                ctx2.beginPath();
                ctx2.arc(x, y, r, 0, Math.PI * 2, true);
                ctx2.stroke();
            };

            const picBuffer = await getTgProfilePic(targetId);
            if (picBuffer) {
                await drawProfile(picBuffer, posX, posY, sizeR, "#FF0000");
            }

            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
            const outPath = path.join(cacheDir, `hijla_${targetId}.png`);
            fs.writeFileSync(outPath, canvas.toBuffer('image/png'));

            try { await api.deleteMessage(chatId, waitMsg.message_id); } catch {}

            const outputMessage = `┌───────────────┐\n ✨ HIJLA SYSTEM ✨\n└───────────────┘\n👤 Victim: ${targetName}\n💬 Result: ${randomMsg}\n━━━━━━━━━━━━━━━━━\nPowered by: Eren-AI`;

            await api.sendPhoto(chatId, { source: fs.createReadStream(outPath) }, {
                caption: outputMessage,
                reply_to_message_id: message.message_id
            });

            fs.unlinkSync(outPath);

        } catch (e) {
            console.error("HIJLA ERROR:", e.message);
            try { await api.deleteMessage(chatId, waitMsg.message_id); } catch {}
            return await api.sendMessage(chatId, "❌ Error: Unable to load profile picture.", { reply_to_message_id: message.message_id });
        }
    }
};