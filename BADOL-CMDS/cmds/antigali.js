// ✅ BADOL V6.1 - SMALL WORD FIX - bal / বাল 100% কাজ করবে
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
let canvasModule = null;
try { canvasModule = require('canvas'); } catch {}

const DATA_DIR = path.join(__dirname, "BADOL");
const DB_PATH = path.join(DATA_DIR, "antigali_db.json");
const WORDS_PATH = path.join(DATA_DIR, "gali.json");
const CACHE_DIR = path.join(DATA_DIR, "cache");
const OWNER_ID = "6954597258";

function ensureDirs() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH)) fs.writeJsonSync(DB_PATH, {}, { spaces: 2 });
    if (!fs.existsSync(WORDS_PATH)) fs.writeJsonSync(WORDS_PATH, { unique_words: [] }, { spaces: 2 });
}

const getDB = () => { try { return fs.readJsonSync(DB_PATH); } catch { return {}; } };
const saveDB = (d) => { try { fs.writeJsonSync(DB_PATH, d, { spaces: 2 }); } catch {} };

const getWords = () => {
    try {
        if (!fs.existsSync(WORDS_PATH)) return [];
        const data = fs.readJsonSync(WORDS_PATH);
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.unique_words)) return data.unique_words;
        return [];
    } catch { return []; }
};

const saveWords = (w) => {
    try { fs.writeJsonSync(WORDS_PATH, { unique_words: w }, { spaces: 2 }); } catch {}
};

const getStatus = (id) => getDB()[String(id)] || false;

// ✅ NEW DETECTION - Regex না, Direct includes
const findGali = (text) => {
    if (!text) return null;
    const lowerText = text.toLowerCase();
    const words = getWords();
    // Long words আগে check করো - যেমন "বালের মাথা" আগে, "বাল" পরে
    const sorted = [...words].sort((a,b) => b.length - a.length);
    for (const w of sorted) {
        if (!w) continue;
        const lw = w.toLowerCase();
        // ✅ Check করো text এ word টা আছে কিনা
        if (lowerText.includes(lw)) {
            return w; // যেই গালি পাইছে return
        }
    }
    return null;
};

module.exports = {
    config: {
        name: "antigali",
        aliases: ["nogali"],
        version: "6.1-small-word-fix",
        author: "MOHAMMAD BADOL",
        role: 1,
        cooldown: 1,
        usePrefix: true,
        description: "bal fix - includes check",
        category: "moderation"
    },

    BADOL: async function({ api, chatId, args }) {
        ensureDirs();
        let words = getWords();
        const opt = (args[0] || "").toLowerCase();

        if (!opt || ["help","status"].includes(opt)) {
            const isOn = getStatus(chatId);
            const db = getDB();
            const size = fs.existsSync(WORDS_PATH)? fs.statSync(WORDS_PATH).size : 0;
            return await api.sendMessage(chatId,
                `🛡️ ANTI-GALI V6.1\n`+
                `Status: ${isOn?"🟢 ON":"🔴 OFF"}\n`+
                `Words: ${words.length} ✅\n`+
                `File: gali.json (${(size/1024).toFixed(1)} KB)\n`+
                `Fix: Small word detection\n`+
                `Groups: ${Object.keys(db).length}\n\n`+
                `/antigali on/off/add/remove/list`
            );
        }

        if (opt === "on" || opt === "off") {
            let db = getDB(); db[String(chatId)] = (opt==="on"); saveDB(db);
            words = getWords();
            return await api.sendMessage(chatId, `✅ ${opt.toUpperCase()} | Words: ${words.length} | Small word fix ✅`);
        }

        if (opt === "add") {
            const w = args.slice(1).join(" ").trim().toLowerCase();
            if (!w) return await api.sendMessage(chatId, `Usage: /antigali add <word>`);
            words = getWords();
            if (words.includes(w)) return await api.sendMessage(chatId, `❌ Already: ${w}`);
            words.push(w); saveWords(words);
            return await api.sendMessage(chatId, `✅ Added: ${w}\nTotal: ${words.length}`);
        }

        if (["remove","rm"].includes(opt)) {
            const w = args.slice(1).join(" ").trim().toLowerCase();
            words = getWords();
            const idx = words.indexOf(w);
            if (idx===-1) return await api.sendMessage(chatId, `❌ Not found: ${w}`);
            words.splice(idx,1); saveWords(words);
            return await api.sendMessage(chatId, `✅ Removed: ${w}\nTotal: ${words.length}`);
        }

        if (opt==="list") {
            words = getWords();
            if (!words.length) return await api.sendMessage(chatId, `Empty!`);
            return await api.sendMessage(chatId, `📜 [${words.length}]: ${words.slice(0,60).join(", ")}`);
        }
    },

    onChat: async function({ api, chatId, userId, msg }) {
        try {
            if (String(userId)===OWNER_ID) return;
            if (msg.from?.is_bot) return;
            const body = (msg.text||msg.caption||"").trim();
            if (!body) return;
            if (!getStatus(chatId)) return;

            // Admin check
            try {
                if (String(chatId).startsWith("-")) {
                    const admins = await api.getChatAdministrators(chatId).catch(()=>[]);
                    if (admins.some(a=>String(a.user.id)===String(userId))) return;
                }
            } catch {}

            // ✅ NEW WAY - bal / বাল detect
            const detected = findGali(body);
            if (!detected) return;

            console.log(`[ANTIGALI] Detected: ${detected} in "${body}"`);

            const cachePath = path.join(CACHE_DIR, `warn_${userId}_${Date.now()}.png`);
            try {
                if (canvasModule) {
                    const { createCanvas, loadImage } = canvasModule;
                    let buf = null;
                    try {
                        const photos = await api.getUserProfilePhotos(userId, 0, 1);
                        if (photos.total_count>0) {
                            const link = await api.getFileLink(photos.photos[0][0].file_id);
                            const r = await axios.get(link, { responseType: 'arraybuffer' });
                            buf = Buffer.from(r.data);
                        }
                    } catch {}
                    let img;
                    if (buf) img = await loadImage(buf);
                    else {
                        const blank = createCanvas(720, 720);
                        blank.getContext('2d').fillStyle="#222";
                        blank.getContext('2d').fillRect(0,0,720,720);
                        fs.writeFileSync(cachePath, blank.toBuffer());
                        img = await loadImage(cachePath);
                    }
                    const canvas = createCanvas(img.width, img.height);
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    ctx.fillStyle="rgba(0,0,0,0.45)";
                    ctx.fillRect(0,0,img.width,img.height);
                    ctx.fillStyle="red";
                    ctx.font="bold 15px Arial";
                    ctx.textAlign="center";
                    ctx.strokeStyle="black";
                    ctx.lineWidth=4;
                    ctx.strokeText("WARNING", img.width/2, img.height/2-25);
                    ctx.fillText("WARNING", img.width/2, img.height/2-25);
                    ctx.fillStyle="white";
                    ctx.font="bold 10px Arial";
                    ctx.lineWidth=3;
                    ctx.strokeText("Eren-AI", img.width/2, img.height/2+60);
                    ctx.fillText("Eren-AI", img.width/2, img.height/2+60);
                    fs.writeFileSync(cachePath, canvas.toBuffer());
                    await api.sendPhoto(chatId, { source: fs.createReadStream(cachePath) }, {
                        caption: `╭─⚠️ WARNING ─╮\n│ Word: "${detected}"\n╰───────────────╯\n👤 ${msg.from?.first_name||"User"}`,
                        reply_to_message_id: msg.message_id
                    });
                    setTimeout(()=>{ if(fs.existsSync(cachePath)) fs.unlinkSync(cachePath); },5000);
                } else {
                    await api.sendMessage(chatId, `⚠️ Word: "${detected}"\n👤 ${msg.from?.first_name||"User"}`, { reply_to_message_id: msg.message_id });
                }
            } catch (e) {
                console.log(e.message);
                await api.sendMessage(chatId, `⚠️ Gali: "${detected}"`, { reply_to_message_id: msg.message_id });
            }
        } catch (e) { console.log("[ANTIGALI ERROR]", e.message); }
    }
};