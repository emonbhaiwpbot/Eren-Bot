const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "pic",
        aliases: ["pinterest"],
        version: "1.0.0",
        author: "MOHAMMAD BADOL",
        role: 0,
        cooldown: 5,
        prefix: true,
        category: "media",
        description: "Pinterest search",
        guide: "/pin cat 5"
    },

    BADOL: async function ({ api, chatId, event, args }) {
        let query = args.join(" ");
        let limit = 6;

        const lastArg = parseInt(args[args.length - 1]);
        if (!isNaN(lastArg)) {
            limit = lastArg;
            query = args.slice(0, -1).join(" ");
        }

        if (!query) {
            return await api.sendMessage(chatId, "❌ | Query দিন।\nExample: /pin cat 5");
        }

        const searching = await api.sendMessage(chatId, `🔍 Searching for "${query}"...`);

        try {
            const configJson = await axios.get("https://raw.githubusercontent.com/SAGOR-OFFICIAL-09/api/refs/heads/main/ApiUrl.json");
            const apiBase = configJson.data.apis.pinterest;
            const res = await axios.get(`${apiBase}/sagor?q=${encodeURIComponent(query)}&limit=${limit}&apikey=sagor`);

            const images = res.data.images;
            if (!images || images.length === 0) {
                await api.deleteMessage(chatId, searching.message_id).catch(()=>{});
                return await api.sendMessage(chatId, "❌ | No results found.");
            }

            const dir = path.join(__dirname, "cache");
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const imgPaths = [];
            const mediaGroup = [];

            for (let i = 0; i < Math.min(images.length, limit); i++) {
                const filePath = path.join(dir, `pin_${Date.now()}_${i}.jpg`);
                try {
                    const imageResponse = await axios.get(images[i], { responseType: 'arraybuffer', timeout: 10000 });
                    if (imageResponse.data.byteLength < 6000) continue;
                    fs.writeFileSync(filePath, Buffer.from(imageResponse.data));
                    imgPaths.push(filePath);
                    mediaGroup.push({ type: "photo", media: { source: filePath } });
                } catch (e) { continue; }
            }

            if (mediaGroup.length === 0) {
                await api.deleteMessage(chatId, searching.message_id).catch(()=>{});
                return await api.sendMessage(chatId, "❌ | Failed to download images.");
            }

            const msg = `┌───────────────┐\n 📌 PINTEREST RESULTS\n└───────────────┘\n🔎 Query: ${query}\n🔢 Count: ${mediaGroup.length}\n━━━━━━━━━━━━━━━━━\n🤖 Eren-AI`;

            // ✅ Telegram Album Send
            if (mediaGroup.length === 1) {
                await api.sendPhoto(chatId, { source: imgPaths[0] }, { caption: msg });
            } else {
                // First photo with caption
                mediaGroup[0].caption = msg;
                await api.sendMediaGroup(chatId, mediaGroup);
            }

            // Clean
            imgPaths.forEach(p => { try { fs.unlinkSync(p); } catch {} });
            await api.deleteMessage(chatId, searching.message_id).catch(()=>{});

        } catch (err) {
            console.log("PIN ERROR:", err.message);
            await api.deleteMessage(chatId, searching.message_id).catch(()=>{});
            await api.sendMessage(chatId, "❌ | Server error! Try again later.");
        }
    }
};