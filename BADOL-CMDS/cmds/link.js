// ✅ LINK V15 FINAL - COPY FIXED - BADOL-TG-BOT - 100% WORKING
if (!global.badol) global.badol = {};
if (!global.badol.onReply) global.badol.onReply = new Map();
if (!global.badol.onCallback) global.badol.onCallback = new Map();
if (!global.linkState) global.linkState = new Map();
if (!global.linkUrls) global.linkUrls = new Map();

const PLATFORMS = [
    { id: "whatsapp", name: "WhatsApp" }, { id: "telegram", name: "Telegram" }, { id: "instagram", name: "Instagram" }, { id: "facebook", name: "Facebook" }, { id: "messenger", name: "Messenger" },
    { id: "tiktok", name: "TikTok" }, { id: "youtube", name: "YouTube" }, { id: "github", name: "GitHub" }, { id: "twitter", name: "Twitter" }, { id: "google", name: "Google" },
    { id: "discord", name: "Discord" }, { id: "reddit", name: "Reddit" }, { id: "snapchat", name: "Snapchat" }, { id: "pinterest", name: "Pinterest" }, { id: "twitch", name: "Twitch" },
    { id: "spotify", name: "Spotify" }, { id: "threads", name: "Threads" }, { id: "skype", name: "Skype" }, { id: "linkedin", name: "LinkedIn" }, { id: "steam", name: "Steam" },
    { id: "quora", name: "Quora" }, { id: "tumblr", name: "Tumblr" }, { id: "flickr", name: "Flickr" }, { id: "deviantart", name: "Deviant" }, { id: "imo", name: "IMO" },
    { id: "xing", name: "Xing" }, { id: "meetup", name: "Meetup" }, { id: "blogger", name: "Blogger" }, { id: "myspace", name: "Myspace" }, { id: "lastfm", name: "LastFM" },
    { id: "askfm", name: "AskFM" }, { id: "vkontakte", name: "VK" }, { id: "line", name: "Line" }, { id: "viber", name: "Viber" }, { id: "behance", name: "Behance" },
    { id: "dribbble", name: "Dribbble" }, { id: "medium", name: "Medium" }, { id: "soundcloud", name: "SoundCloud" }, { id: "vimeo", name: "Vimeo" }, { id: "wattpad", name: "Wattpad" },
    { id: "patreon", name: "Patreon" }, { id: "telegramchannel", name: "TG Channel" }, { id: "discordserv", name: "Discord S" }, { id: "slack", name: "Slack" }, { id: "zoom", name: "Zoom" },
    { id: "trello", name: "Trello" }, { id: "notion", name: "Notion" }, { id: "figma", name: "Figma" }, { id: "upwork", name: "Upwork" }, { id: "fiverr", name: "Fiverr" }
];

function genKeyboard(page = 0) {
    const perPage = 10;
    const start = page * perPage;
    const items = PLATFORMS.slice(start, start + perPage);
    let kb = [];
    for (let i = 0; i < items.length; i += 2) {
        let row = [];
        row.push({ text: items[i].name, callback_data: `link_pf_${items[i].id}` });
        if (items[i + 1]) row.push({ text: items[i + 1].name, callback_data: `link_pf_${items[i + 1].id}` });
        kb.push(row);
    }
    let nav = [];
    if (page > 0) nav.push({ text: "⬅️ Prev", callback_data: `link_page_${page - 1}` });
    if (start + perPage < PLATFORMS.length) nav.push({ text: "Next ➡️", callback_data: `link_page_${page + 1}` });
    if (nav.length) kb.push(nav);
    kb.push([{ text: "❌ Close", callback_data: "link_close" }]);
    return kb;
}
function getMenuText(page) { return `╭─❑ Eren-AI\n│ 🌐 Platform Menu (50+): Page ${page + 1}/5\n├──────────────────────────\n│ 👇 Platform বাছুন\n╰──────────────────────────`; }
function generateUrl(platform, inputVal) {
    const urls = {
        whatsapp: `https://wa.me/${inputVal.replace(/\D/g, "")}`, telegram: `https://t.me/${inputVal}`, instagram: `https://instagram.com/${inputVal}`,
        facebook: `https://www.facebook.com/${inputVal}`, messenger: `https://m.me/${inputVal}`, tiktok: `https://www.tiktok.com/@${inputVal}`,
        youtube: `https://www.youtube.com/@${inputVal}`, github: `https://github.com/${inputVal}`, twitter: `https://twitter.com/${inputVal}`,
        google: `https://google.com/search?q=${inputVal}`, discord: `https://discord.com/users/${inputVal}`, reddit: `https://reddit.com/user/${inputVal}`,
        snapchat: `https://snapchat.com/add/${inputVal}`, pinterest: `https://pinterest.com/${inputVal}`, twitch: `https://twitch.tv/${inputVal}`,
        spotify: `https://open.spotify.com/user/${inputVal}`, threads: `https://www.threads.net/@${inputVal}`, skype: `https://join.skype.com/invite/${inputVal}`,
        linkedin: `https://linkedin.com/in/${inputVal}`, steam: `https://steamcommunity.com/id/${inputVal}`, quora: `https://quora.com/profile/${inputVal}`,
        tumblr: `https://${inputVal}.tumblr.com`, flickr: `https://flickr.com/photos/${inputVal}`, deviantart: `https://deviantart.com/${inputVal}`,
        imo: `https://imo.im/${inputVal}`, xing: `https://xing.com/profile/${inputVal}`, meetup: `https://meetup.com/${inputVal}`,
        blogger: `https://${inputVal}.blogspot.com`, myspace: `https://myspace.com/${inputVal}`, lastfm: `https://last.fm/user/${inputVal}`,
        askfm: `https://ask.fm/${inputVal}`, vkontakte: `https://vk.com/${inputVal}`, line: `https://line.me/ti/p/~${inputVal}`,
        viber: `https://viber.com/${inputVal}`, behance: `https://behance.net/${inputVal}`, dribbble: `https://dribbble.com/${inputVal}`,
        medium: `https://medium.com/@${inputVal}`, soundcloud: `https://soundcloud.com/${inputVal}`, vimeo: `https://vimeo.com/${inputVal}`,
        wattpad: `https://wattpad.com/user/${inputVal}`, patreon: `https://patreon.com/${inputVal}`, telegramchannel: `https://t.me/${inputVal}`,
        discordserv: `https://discord.gg/${inputVal}`, slack: `https://${inputVal}.slack.com`, zoom: `https://zoom.us/j/${inputVal}`,
        trello: `https://trello.com/${inputVal}`, notion: `https://notion.so/${inputVal}`, figma: `https://figma.com/@${inputVal}`,
        upwork: `https://upwork.com/freelancers/${inputVal}`, fiverr: `https://fiverr.com/${inputVal}`
    };
    return urls[platform] || `https://${platform}.com/${inputVal}`;
}

module.exports = {
    config: { name: "link", aliases: ["weblink","url"], description: "Generate 50+ links - Copy Fixed", usage: "/link", cooldown: 3, role: 0, prefix: true, author: "MOHAMMAD BADOL" },

    BADOL: async function ({ api, chatId, event }) {
        const text = getMenuText(0);
        const kb = genKeyboard(0);
        const sent = await api.sendMessage(chatId, text, { reply_markup: { inline_keyboard: kb } });
        global.badol.onCallback.set(sent.message_id, { commandName: "link" });
        global.linkState.set(chatId, { msgId: sent.message_id, author: event.from.id, step: "menu" });
    },

    onReply: async function ({ event, api, Reply }) {
        const chatId = event.chat.id;
        const state = global.linkState.get(chatId);
        if (!state || state.step!== "waiting_username") return;

        const inputVal = (event.text || "").trim().replace("@","").split(" ")[0];
        if (!inputVal || inputVal.length < 2) {
            await api.sendMessage(chatId, "❌ Valid Username দিন!", { reply_to_message_id: event.message_id });
            return;
        }

        const platform = state.platform;
        const url = generateUrl(platform, inputVal);
        global.linkUrls.set(`${chatId}_${state.msgId}`, url);

        const doneText = `╭─❑ Eren-Ai\n│ 🔗 Link Generated!\n├──────────────────────────\n│ 🌐 ${platform.toUpperCase()}\n│ 👤 ${inputVal}\n│ 🔗 <code>${url}</code>\n│\n│ 👇 Copy করতে বাটনে/লিংকে চাপুন\n╰──────────────────────────`;

        // ✅ COPY_TEXT FIX - Telegram New Feature
        const kb = [
            [{ text: "📋 Copy Link", copy_text: { text: url } }, { text: "🔗 Open Link", url: url }],
            [{ text: "✏️ New Username", callback_data: `link_enter_${platform}` }, { text: "🔄 New Platform", callback_data: "link_page_0" }],
            [{ text: "❌ Close", callback_data: "link_close" }]
        ];

        try {
            await api.editMessageText(doneText, { chat_id: chatId, message_id: state.msgId, parse_mode: "HTML", reply_markup: { inline_keyboard: kb } });
        } catch (e) {
            await api.sendMessage(chatId, doneText, { parse_mode: "HTML", reply_markup: { inline_keyboard: kb } });
        }
        global.linkState.set(chatId, { platform, msgId: state.msgId, step: "done", author: event.from.id });
    },

    onCallback: async function ({ event, api, ctx }) {
        const data = event.data;
        const chatId = event.message.chat.id;
        const msgId = event.message.message_id;
        const userId = event.from.id;
        try { await ctx.answerCbQuery(); } catch {}

        if (data === "link_close") {
            try { await ctx.editMessageText("╭─❑ BADOL-TG-BOT\n│ ❌ Closed!\n╰──────────────────────────"); } catch {}
            global.linkState.delete(chatId);
            return;
        }
        if (data.startsWith("link_page_")) {
            const page = parseInt(data.split("_")[2]);
            try { await ctx.editMessageText(getMenuText(page), { reply_markup: { inline_keyboard: genKeyboard(page) } }); } catch {}
            return;
        }
        if (data.startsWith("link_pf_")) {
            const platform = data.replace("link_pf_", "");
            global.linkState.set(chatId, { platform, msgId, step: "select_platform", author: userId });
            const selectText = `╭─❑ Eren-AI\n│ ✅ Selected: ${platform.toUpperCase()}\n├──────────────────────────\n│ 👇 Username দিতে বাটন চাপুন\n╰──────────────────────────`;
            const kb = [[{ text: `✏️ Enter Username`, callback_data: `link_enter_${platform}` }], [{ text: "🔙 Menu", callback_data: "link_page_0" }, { text: "❌ Close", callback_data: "link_close" }]];
            try { await ctx.editMessageText(selectText, { reply_markup: { inline_keyboard: kb } }); } catch {}
            return;
        }
        if (data.startsWith("link_enter_")) {
            const platform = data.replace("link_enter_", "");
            global.linkState.set(chatId, { platform, msgId, step: "waiting_username", author: userId });
            const askText = `╭─❑ Eren-AI\n│ 🌐 ${platform.toUpperCase()}\n├──────────────────────────\n│ ✏️ এই মেসেজে REPLY দিয়ে\n│ Username লিখুন\n│ Ex: badol123\n│ ⏳ Waiting...\n╰──────────────────────────`;
            const kb = [[{ text: "🔙 Back", callback_data: `link_pf_${platform}` }, { text: "🏠 Menu", callback_data: "link_page_0" }]];
            try {
                await ctx.editMessageText(askText, { reply_markup: { inline_keyboard: kb } });
                global.badol.onReply.set(msgId, { commandName: "link", platform, author: userId, msgId: msgId });
            } catch {}
            return;
        }
        if (data.startsWith("link_copy_")) {
            const stored = global.linkUrls.get(`${chatId}_${msgId}`);
            if (!stored) { try { await ctx.answerCbQuery("❌ Expired!", { show_alert: true }); } catch {} return; }
            try { await ctx.answerCbQuery("📋 Copied: " + stored); } catch {}
            await api.sendMessage(chatId, `✅ <b>Tap to Copy:</b>\n<code>${stored}</code>`, { parse_mode: "HTML" }).catch(()=>{});
            return;
        }
    }
};