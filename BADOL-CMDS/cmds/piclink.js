/**
 * 🤖 BADOL-TG-BOT COMMAND: PICLINK
 * 👤 CREDIT: MOHAMMAD BADOL
 */

const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
    config: {
        name: "piclink",
        aliases: ["showpic", "image"],
        version: "1.0.0",
        author: "MOHAMMAD BADOL",
        role: 0,
        cooldown: 3,
        prefix: true,
        category: "utility",
        description: "লিঙ্ক থেকে ছবি প্রদর্শন করুন।",
        guide: "/piclink <link>"
    },

    BADOL: async function ({ api, chatId, event, args }) {
        try {
            if (!args || args.length === 0) {
                return await api.sendMessage(chatId,
                    "❌ লিংক দিন।\nউদাহরণ:\n/piclink https://example.com/image.jpg",
                    { reply_to_message_id: event.message_id }
                );
            }

            const url = args[0];
            await api.sendChatAction(chatId, "upload_photo");

            // ১. সরাসরি ছবি লিংক হলে
            if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
                return await api.sendPhoto(chatId, url, {
                    caption: `✅ ছবিটি এখানে:\n🤖 BADOL-TG-BOT\n🛡️ Credit: MOHAMMAD BADOL`,
                    reply_to_message_id: event.message_id
                });
            }

            // ২. OG Image Scraping
            const response = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);

            const imageUrl =
                $('meta[property="og:image"]').attr("content") ||
                $('meta[name="og:image"]').attr("content") ||
                $('meta[name="twitter:image"]').attr("content") ||
                $('link[rel="image_src"]').attr("href");

            if (!imageUrl) {
                return await api.sendMessage(chatId,
                    "⚠️ এই লিংক থেকে কোনো ছবি পাওয়া যায়নি।",
                    { reply_to_message_id: event.message_id }
                );
            }

            // Relative URL Fix
            let finalUrl = imageUrl;
            if (finalUrl.startsWith("/")) {
                const u = new URL(url);
                finalUrl = u.origin + finalUrl;
            }

            return await api.sendPhoto(chatId, finalUrl, {
                caption: `✅ ছবিটি পাওয়া গেছে:\n🤖 Eren-AI`,
                reply_to_message_id: event.message_id
            });

        } catch (error) {
            console.error("PICLINK ERROR:", error.message);
            return await api.sendMessage(chatId,
                "⚠️ ছবি লোড করতে সমস্যা হয়েছে। লিংকটি সঠিক কিনা চেক করুন!",
                { reply_to_message_id: event.message_id }
            );
        }
    }
};