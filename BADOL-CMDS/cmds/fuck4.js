// ✅ BADOL TG BOT V8.6 - FUCK6 CONVERTED
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
    config: {
        name: "fuck4",
        version: "8.6-CONVERTED",
        author: "MOHAMMAD BADOL",
        role: 0,
        description: "fuck you",
        category: "fun",
        prefix: true,
        aliases: ["fk4"],
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

        if (!targetId) return await api.sendMessage(chatId, "『 ⚠️ 』Reply দাও!");
        const senderId = msg.from.id;
        const senderName = msg.from.first_name || "You";

        if (String(targetId) === "6954597258") return await api.sendMessage(chatId, "『 ❌ 』এই ID নিষেধ!");
        if (String(senderId) === String(targetId)) return await api.sendMessage(chatId, "『 😏 』নিজের সাথে?");

        const waitMsg = await api.sendMessage(chatId, "⏳ বানাচ্ছি...");

        async function getDPBuffer(uid) {
            const photos = await api.getUserProfilePhotos(uid);
            if (photos.total_count === 0) throw new Error("DP নেই");
            const bestId = photos.photos[0][photos.photos[0].length - 1].file_id;
            const link = await api.getFileLink(bestId);
            const res = await axios.get(link, { responseType: 'arraybuffer' });
            return Buffer.from(res.data);
        }

        async function makeImage(oneBuf, twoBuf) {
            const bgUrl = "https://drive.google.com/uc?id=1U0qBk2rLKB3akl45QIeI5Oj00Vkf5BWD";
            const bgRes = await axios.get(bgUrl, { responseType: 'arraybuffer' });
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

            await drawCircle(oneBuf, 100, 100, 180);
            await drawCircle(twoBuf, 400, 420, 180);
            return canvas.toBuffer("image/png");
        }

        const messages = [
            "🔥 আগুন লেগে গেছে! ডিরেক্ট হিট!",
            "😈 প্যাক করে দিলাম, পালানোর পথ নেই!",
            "🥵 মোড অ্যাক্টিভেটেড!",
            "⚡ সাবধান! এটা স্রেফ শুরু!",
            "💦 ফাক মোড অন!"
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];

        try {
            const [oneBuf, twoBuf] = await Promise.all([getDPBuffer(senderId), getDPBuffer(targetId)]);
            const finalBuffer = await makeImage(oneBuf, twoBuf);
            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
            const outPath = path.join(cacheDir, `fuck6_${Date.now()}.png`);
            fs.writeFileSync(outPath, finalBuffer);
            try { await api.deleteMessage(chatId, waitMsg.message_id); } catch {}
            await api.sendPhoto(chatId, { source: fs.createReadStream(outPath) }, {
                caption: `┌───────────────┐\n ${randomMsg}\n└───────────────┘\n✨ BADOL-TG-BOT-\n👤 ${senderName} ➡️ ${targetName}`
            });
            fs.unlink(outPath, ()=>{});
        } catch (err) {
            try { await api.deleteMessage(chatId, waitMsg.message_id); } catch {}
            return await api.sendMessage(chatId, `『 ❌ 』এরর: ${err.message}`);
        }
    }
};