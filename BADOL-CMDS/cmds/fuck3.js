// ✅ BADOL TG BOT V8.6 - FUCK5 CONVERTED - FB TO TG
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
    config: {
        name: "fuck3",
        version: "8.6-CONVERTED",
        author: "MOHAMMAD BADOL",
        role: 0,
        description: "fuck you",
        category: "fun",
        prefix: true,
        aliases: ["fk3"],
        cooldown: 5
    },

    BADOL: async function({ api, chatId, ctx, event }) {
        const msg = event || ctx?.message || {};
        const replied = msg.reply_to_message;

        let targetId = null;
        let targetName = "Target";
        if (replied) {
            targetId = replied.from.id;
            targetName = replied.from.first_name || "Target";
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
            return await api.sendMessage(chatId, "『 😏 』নিজের সাথে?");
        }

        const waitMsg = await api.sendMessage(chatId, "⏳ বানাচ্ছি...");

        async function getDPBuffer(uid) {
            const photos = await api.getUserProfilePhotos(uid);
            if (photos.total_count === 0) throw new Error("DP নেই");
            const bestId = photos.photos[0][photos.photos[0].length - 1].file_id;
            const link = await api.getFileLink(bestId);
            const res = await axios.get(link, { responseType: 'arraybuffer', timeout: 15000 });
            return Buffer.from(res.data);
        }

        async function makeImage(oneBuf, twoBuf) {
            const bgUrl = "https://drive.google.com/uc?id=1LOAwoOE110QtWQF8k8iFJpaeBiDEs5p7";
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

            // ✅ Original Position Same - Change করি নাই
            await drawCircle(oneBuf, 330, 150, 180);
            await drawCircle(twoBuf, 585, 420, 180);

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
            const outPath = path.join(cacheDir, `fuck5_${Date.now()}.png`);
            fs.writeFileSync(outPath, finalBuffer);

            try { await api.deleteMessage(chatId, waitMsg.message_id); } catch {}

            await api.sendPhoto(chatId, { source: fs.createReadStream(outPath) }, {
                caption: `┌───────────────┐\n ${randomMsg}\n└───────────────┘\n✨ BADOL-TG-BOT-\n👤 ${senderName} ➡️ ${targetName}`
            });

            fs.unlink(outPath, ()=>{});

        } catch (err) {
            console.error("FUCK3 ERROR:", err.message);
            try { await api.deleteMessage(chatId, waitMsg.message_id); } catch {}
            return await api.sendMessage(chatId, `『 ❌ 』এরর: ${err.message}`);
        }
    }
};