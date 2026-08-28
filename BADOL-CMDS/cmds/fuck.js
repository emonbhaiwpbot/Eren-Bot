// ✅ BADOL TG BOT V8.6 - BEAT - TARGET DP FIXED - DRIVE BG
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
    config: {
        name: "fuck",
        version: "8.6-DP-FIXED-V2",
        author: "MOHAMMAD BADOL",
        role: 0,
        description: "Fun beat banner",
        category: "fun",
        prefix: true,
        aliases: ["slap", "fk"],
        cooldown: 5
    },

    BADOL: async function({ api, chatId, ctx, event, userId }) {
        const msg = event || ctx?.message || {};
        const replied = msg.reply_to_message;
        if (!replied) return await api.sendMessage(chatId, "⚠️ Reply দিয়ে /beat লিখো!");

        const targetId = replied.from.id;
        const senderId = msg.from?.id || userId;
        const targetName = replied.from.first_name || "Target";
        const senderName = msg.from?.first_name || "You";

        let waitMsg;
        try { waitMsg = await api.sendMessage(chatId, "⏳ বানাচ্ছি..."); } catch {}

        // ✅ FIXED: getFileLink ব্যবহার - Target এর DP 100% পাবে
        async function getDP(uid, fallbackName) {
            try {
                const photos = await api.getUserProfilePhotos(uid);
                console.log(`[BEAT] ${uid} total: ${photos.total_count}`);
                if (photos.total_count > 0) {
                    const bestId = photos.photos[0][photos.photos[0].length - 1].file_id;
                    const link = await api.getFileLink(bestId); // ✅ Token লাগে না
                    const res = await axios.get(link, { responseType: 'arraybuffer', timeout: 15000 });
                    console.log(`[BEAT] ${uid} DP OK via getFileLink`);
                    return Buffer.from(res.data);
                }
            } catch (e) {
                console.log(`[BEAT] ${uid} Method1 fail:`, e.message);
            }

            // Method 2: getChat
            try {
                const chat = await api.getChat(uid);
                if (chat.photo) {
                    const fileId = chat.photo.big_file_id;
                    const link = await api.getFileLink(fileId);
                    const res = await axios.get(link, { responseType: 'arraybuffer' });
                    console.log(`[BEAT] ${uid} DP OK via getChat`);
                    return Buffer.from(res.data);
                }
            } catch (e) {
                console.log(`[BEAT] ${uid} Method2 fail:`, e.message);
            }

            // Fallback avatar with name
            try {
                const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random&size=512`;
                const res = await axios.get(url, { responseType: 'arraybuffer' });
                console.log(`[BEAT] ${uid} Fallback avatar`);
                return Buffer.from(res.data);
            } catch { return null; }
        }

        try {
            const BG_URL = "https://drive.google.com/uc?id=1B9PuRuH89gWd5j60SnyhH6Qbl1zeW8Zf";

            let [dp1, dp2] = await Promise.all([
                getDP(senderId, senderName),
                getDP(targetId, targetName)
            ]);

            console.log("[BEAT] Final:", dp1? "sender OK" : "sender NULL", dp2? "target OK" : "target NULL");

            if (!dp1 ||!dp2) {
                if (waitMsg) try { await api.deleteMessage(chatId, waitMsg.message_id); } catch {}
                return await api.sendMessage(chatId, "❌ DP Fail! দুইজনেরই DP লাগবে!");
            }

            const bgRes = await axios.get(BG_URL, { responseType: 'arraybuffer', timeout: 15000 });
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
                c.strokeStyle = "#FF0000";
                c.lineWidth = 5;
                c.beginPath();
                c.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
                c.stroke();
            }

            await drawCircle(dp1, 350, 200, 180);
            await drawCircle(dp2, 600, 200, 180);

            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
            const outPath = path.join(cacheDir, `beat_${Date.now()}.png`);
            fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

            if (waitMsg) try { await api.deleteMessage(chatId, waitMsg.message_id); } catch {}

            const texts = ["তোমাকে পিটাইতে চাই 😁", "খবর আছে 🤧", "ধোলাই দেবো 😈"];
            const r = texts[Math.floor(Math.random()*texts.length)];

            await api.sendPhoto(chatId, { source: fs.createReadStream(outPath) }, {
                caption: `┌───────────────┐\n ${r}\n└───────────────┘\n👤 ${senderName} ➡️ ${targetName}`
            });

            fs.unlink(outPath, ()=>{});

        } catch (e) {
            console.error("BEAT ERROR:", e);
            if (waitMsg) try { await api.deleteMessage(chatId, waitMsg.message_id); } catch {}
            return await api.sendMessage(chatId, `❌ Error: ${e.message}`);
        }
    }
};