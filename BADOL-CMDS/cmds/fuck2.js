// ✅ BADOL TG BOT V8.6 - FUCK4 CONVERTED - FB TO TG
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
    config: {
        name: "fuck2",
        version: "8.6-CONVERTED",
        author: "MOHAMMAD BADOL",
        role: 0,
        description: "fuck you",
        category: "fun",
        prefix: true,
        aliases: ["fk2"],
        cooldown: 5
    },

    BADOL: async function({ api, chatId, ctx, event }) {
        const msg = event || ctx?.message || {};
        const replied = msg.reply_to_message;
        const mentions = msg.entities? msg.entities.filter(e => e.type === "mention" || e.type === "text_mention") : [];

        // ✅ Target ID - Reply বা Mention থেকে
        let targetId = null;
        let targetName = "Target";

        if (replied) {
            targetId = replied.from.id;
            targetName = replied.from.first_name || "Target";
        } else if (msg.mention) {
            // Mention support
            targetId = msg.mention;
        }

        if (!targetId) {
            return await api.sendMessage(chatId, "『 ⚠️ 』কাকে ফাক করবা Reply দাও!");
        }

        const senderId = msg.from.id;
        const senderName = msg.from.first_name || "You";

        if (String(targetId) === "6954597258") {
            return await api.sendMessage(chatId, "『 ❌ 』এই আইডির ওপর এই কমান্ডটি চালানো নিষেধ!");
        }

        if (String(senderId) === String(targetId)) {
            return await api.sendMessage(chatId, "『 😏 』নিজের সাথে এই কাজ করা কি ঠিক? অন্য কাউকে খুঁজুন!");
        }

        const waitMsg = await api.sendMessage(chatId, "⏳ বানাচ্ছি...");

        // ✅ TG DP to Buffer - getFileLink
        async function getDPBuffer(uid) {
            try {
                const photos = await api.getUserProfilePhotos(uid);
                if (photos.total_count === 0) throw new Error("DP নেই");
                const bestId = photos.photos[0][photos.photos[0].length - 1].file_id;
                const link = await api.getFileLink(bestId);
                const res = await axios.get(link, { responseType: 'arraybuffer', timeout: 15000 });
                return Buffer.from(res.data);
            } catch (e) {
                throw new Error(`DP Load Fail: ${e.message}`);
            }
        }

        async function makeImage(oneBuf, twoBuf) {
            const bgUrl = "https://drive.google.com/uc?id=1c24sOVkDAXXsoGAPPb1ribsLJkBhUZ90";
            const bgRes = await axios.get(bgUrl, { responseType: 'arraybuffer', timeout: 15000 });
            const bgImg = await loadImage(Buffer.from(bgRes.data));

            const canvas = createCanvas(bgImg.width, bgImg.height);
            const c = canvas.getContext('2d');
            c.drawImage(bgImg, 0, 0);

            async function drawCircle(buffer, x, y, size) {
                const img = await loadImage(buffer);
                c.save();
                c.beginPath();
                c.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
                c.closePath();
                c.clip();
                c.drawImage(img, x, y, size, size);
                c.restore();
            }

            // ✅ তোমার Original Position Same
            await drawCircle(oneBuf, 260, 150, 180);
            await drawCircle(twoBuf, 470, 140, 180);

            return canvas.toBuffer("image/png");
        }

        const messages = [
            "তোমাকে এই সিস্টেমে লাগাতে চাই প্রিও😁",
            "তোমাকে এই ভাবে করতে চাই 🤧",
            "তোমাকে ঠিক এভাবে চু*দ*বো😈",
            "তোমার জন্য বিশেষ আয়োজন করা হয়েছে 🔥",
            "একে তো আজ ছাড়ছি না 💦"
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];

        try {
            const [oneBuf, twoBuf] = await Promise.all([
                getDPBuffer(senderId),
                getDPBuffer(targetId)
            ]);

            const finalBuffer = await makeImage(oneBuf, twoBuf);

            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
            const outPath = path.join(cacheDir, `fuck4_${Date.now()}.png`);
            fs.writeFileSync(outPath, finalBuffer);

            try { await api.deleteMessage(chatId, waitMsg.message_id); } catch {}

            await api.sendPhoto(chatId, { source: fs.createReadStream(outPath) }, {
                caption: `┌───────────────┐\n ${randomMsg}\n└───────────────┘\n✨ BADOL-TG-BOT\n👤 ${senderName} ➡️ ${targetName}`
            });

            fs.unlink(outPath, ()=>{});

        } catch (err) {
            console.error("FUCK2 ERROR:", err.message);
            try { await api.deleteMessage(chatId, waitMsg.message_id); } catch {}
            return await api.sendMessage(chatId, `『 ❌ 』এরর: ${err.message}`);
        }
    }
};