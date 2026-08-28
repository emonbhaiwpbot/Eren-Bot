function getDateTime() {
    const dhaka = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const d = new Date(dhaka);
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    let h24 = d.getHours();
    let m = d.getMinutes().toString().padStart(2,"0");
    let ampm = h24 >= 12? 'PM' : 'AM';
    let h12 = h24 % 12 || 12;
    let p = "";
    if (h24 >= 5 && h24 < 12) p = "সকাল";
    else if (h24 >= 12 && h24 < 15) p = "দুপুর";
    else if (h24 >= 15 && h24 < 18) p = "বিকাল";
    else p = "রাত";
    return `${days[d.getDay()]} ${p} ${h12}:${m} ${ampm} | ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
}

module.exports = {
    config: {
        name: "start",
        aliases: ["s"],
        version: "9.0 FINAL - MUST JOIN DETAILS",
        author: "MOHAMMAD BADOL",
        role: 0,
        cooldown: 2,
        description: "Must join @erenaiteam details",
        category: "system",
        usePrefix: false
    },

    BADOL: async function({ event, api }) {
        const chat = event.chat;
        const from = event.from;
        const chatId = chat.id;
        const userId = from.id;

        try {
            const full_name = ((from.first_name||"")+" "+(from.last_name||"")).trim() || "Unknown";
            const username = from.username? "@"+from.username : "None";
            const userLink = from.username? `https://t.me/${from.username}` : `tg://user?id=${userId}`;
            const time = getDateTime();
            const isGroup = chat.type === 'group' || chat.type === 'supergroup';

            let memberCount = "N/A";
            let inviteLink = "N/A";
            if(isGroup){
                try{ memberCount = await api.getChatMembersCount(chatId); }catch{}
                try{
                    const c = await api.getChat(chatId);
                    if(c.invite_link) inviteLink = c.invite_link;
                    else if(c.username) inviteLink = `https://t.me/${c.username}`;
                }catch{}
            }

            let credit = 2, ref = 0;
            try {
                const rs = require('../../BADOL/referralSystem');
                const u = await rs.getUser(userId);
                credit = u.credits; ref = u.referrals||0;
            } catch {}

            try {
                let notify = isGroup?
`👥 <b>GROUP START</b>
━━━━━━━━━━━━━━
👤 <b>User:</b> <a href="${userLink}">${full_name}</a>
🔗 <b>Username:</b> ${username}
🆔 <b>ID:</b> <code>${userId}</code>
━━━━━━━━━━━━━━
🏷️ <b>Group:</b> ${chat.title}
🆔 <b>GroupID:</b> <code>${chatId}</code>
👥 <b>Members:</b> ${memberCount}
🔗 <b>Link:</b> ${inviteLink}
💳 <b>Credit:</b> ${credit} | 👥 <b>Refer:</b> ${ref}
━━━━━━━━━━━━━━
⏰ <b>${time}</b>` :
`👤 <b>PRIVATE START</b>
━━━━━━━━━━━━━━
👤 <b>Name:</b> <a href="${userLink}">${full_name}</a>
🔗 <b>Username:</b> ${username}
🆔 <b>ID:</b> <code>${userId}</code>
💳 <b>Credit:</b> ${credit} | 👥 <b>Refer:</b> ${ref}
━━━━━━━━━━━━━━
⏰ <b>${time}</b>`;

                for (const adminId of (global.config.adminUID||[])) {
                    try {
                        const pic = await api.getUserProfilePhotos(userId);
                        if(pic.total_count>0){
                            await api.sendPhoto(adminId, pic.photos[0][0].file_id, { caption: notify, parse_mode: "HTML" });
                        } else {
                            await api.sendMessage(adminId, notify, { parse_mode: "HTML" });
                        }
                    } catch{}
                }
            } catch{}

            const botInfo = await api.getMe();
            const botUsername = botInfo.username;
            const referLink = `https://t.me/${botUsername}?start=ref_${userId}`;

            let userMsg = isGroup?
`✨ <b>Thanks ${from.first_name}!</b> ✅

🤖 <b>Eren-AI Active!</b>
👥 ${chat.title}
⏰ ${time}

💳 <b>Credit:</b> ${credit} | 👥 <b>Refer:</b> ${ref}

━━━━━━━━━━━━━━
⚠️ <b>MUST JOIN:</b>
📌 @erenaiteam এ Join না থাকলে Bonus পাবে না!
👉 Join Must!` :
`✨ <b>Hi ${from.first_name}! Eren-AI Ready! 🚀</b>

👤 <b>${full_name}</b> | ${username}
🆔 <code>${userId}</code>
⏰ ${time}

💳 <b>Credit:</b> ${credit} | 👥 <b>Refer:</b> ${ref}

🤖 <b>Powerful Group Management Bot</b>
📌 Add to Group → Make Admin

━━━━━━━━━━━━━━
⚠️ <b>IMPORTANT - MUST JOIN:</b>
📌 @erenaiteam এ Join করা <b>বাধ্যতামূলক!</b>

❌ Join না থাকলে কি হবে?
├─ Refer Bonus পাবে না (0 Credit)
├─ Paid Command Use করতে পারবে না
└─ /gen /imagine সব Lock থাকবে!

✅ Join থাকলে কি পাবে?
├─ 1 Invite = 5 Credit 🎁
├─ New User = 2 Credit Free
└─ All Paid Unlock!

👉 এখনি Join করো, তারপর /refer দিয়ে Bonus নাও!
━━━━━━━━━━━━━━`;

            const buttons = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "➕ Add Me To Group 🚀", url: `https://t.me/${botUsername}?startgroup=true` },
                            { text: "📢 Add To Channel", url: `https://t.me/${botUsername}?startchannel=true` }
                        ],
                        [
                            { text: "👑 Owner", url: "https://t.me/B4D9L_007" },
                            { text: "📌 Join @erenaiteam (Must) ✅", url: "https://t.me/erenaiteam" }
                        ],
                        [
                            { text: "🔗 Refer & Earn 🎁", callback_data: "refer_top" },
                            { text: "💳 My Balance", url: `https://t.me/${botUsername}?start=ref_${userId}` }
                        ],
                        [
                            { text: "📤 Share Refer Link", switch_inline_query: `Eren-AI Free Credit! ${referLink}` }
                        ]
                    ]
                }
            };

            if (!isGroup) {
                try {
                    const userPhotos = await api.getUserProfilePhotos(userId);
                    if (userPhotos && userPhotos.total_count > 0) {
                        const fileId = userPhotos.photos[0][0].file_id;
                        await api.sendPhoto(chatId, fileId, { caption: userMsg, parse_mode: "HTML",...buttons });
                        return;
                    }
                } catch {}
            }
            await api.sendMessage(chatId, userMsg, { parse_mode: "HTML",...buttons });

        } catch(e){
            console.log("start.js error:", e.message);
        }
    }
};