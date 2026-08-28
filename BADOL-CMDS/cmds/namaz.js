const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// ╔══════════════════╗
// ║ 🕌 নামাজের সময় সেট করার গাইড - বাংলাদেশ রিয়াল টাইম (ঢাকা) ║
// ╠══════════════════╣
// ║ ফরম্যাট: time: "HH:MM" - 24 ঘন্টা ফরম্যাট Must! ║
// ║ ║
// ║ 🇧🇩 বাংলাদেশ রিয়াল টাইম অনুযায়ী বর্তমান সময়: ║
// ║ ফজর : 04:15 - 05:00 (ভোর) ║
// ║ যোহর : 12:00 - 13:30 (দুপুর) ║
// ║ আসর : 15:30 - 17:00 (বিকাল) ║
// ║ মাগরিব : 18:10 - 19:30 (সন্ধ্যা - সূর্যাস্ত) ║
// ║ এশা : 19:30 - 21:00 (রাত) ║
// ║ ║
// ║ কিভাবে চেঞ্জ করবে: ║
// ║ time: "04:15" মানে ভোর ৪টা ১৫ মিনিট ║
// ║ time: "13:00" মানে দুপুর ১টা ০০ মিনিট ║
// ║ time: "17:00" মানে বিকাল ৫টা ০০ মিনিট ║
// ║ time: "19:10" মানে সন্ধ্যা ৭টা ১০ মিনিট ║
// ║ time: "20:10" মানে রাত ৮টা ১০ মিনিট ║
// ║ ║
// ║ নোট: 24 ঘন্টা Use করো! 02:00=রাত ২টা, 14:00=দুপুর ২টা ║
// ╚══════════════════════

const PRAYER_TIMES = [
 { 
   name: "ফজর", time: "04:50", emoji: "🌅", //4:50
   desc: "ভোরের নামাজ",
   fazilat: "ফজরের ২ রাকাত সুন্নত দুনিয়া ও দুনিয়ার সব কিছুর চেয়ে উত্তম",
   hadith: "যে ফজরের নামাজ পড়লো সে আল্লাহর জিম্মায় চলে গেলো",
   quran: "নিশ্চয়ই ফজরের কুরআন পাঠ ফেরেশতারা প্রত্যক্ষ করে - সূরা বনী ইসরাঈল ৭৮",
   rakat: "২ রাকাত সুন্নত + ২ রাকাত ফরজ"
 },
 { 
   name: "যোহর", time: "13:00", emoji: "☀️", //1:00
   desc: "দুপুরের নামাজ",
   fazilat: "যোহরের ৪ রাকাত সুন্নতের বিনিময়ে জান্নাতে ঘর নির্মাণ",
   hadith: "যোহরের সময় জাহান্নামের আগুন উত্তপ্ত করা হয়",
   quran: "তোমরা নামাজের প্রতি যত্নবান হও, বিশেষ করে মধ্যবর্তী নামাজ - বাকারা ২৩৮",
   rakat: "৪ সুন্নত + ৪ ফরজ + ২ সুন্নত + ২ নফল"
 },
 { 
   name: "আসর", time: "16:45", emoji: "🌤️", //4:45 
   desc: "বিকালের নামাজ",
   fazilat: "যে আসরের নামাজ ছেড়ে দিলো তার আমল বরবাদ হয়ে গেলো",
   hadith: "আসরের নামাজ হেফাজত করো, আল্লাহ তোমাদের হেফাজত করবেন",
   quran: "আসরের শপথ! নিশ্চয়ই মানুষ ক্ষতিগ্রস্ত - সূরা আসর ১-২",
   rakat: "৪ সুন্নত + ৪ ফরজ"
 },
 { 
   name: "মাগরিব", time: "18:45", emoji: "🌆", //6:45
   desc: "সন্ধ্যার নামাজ",
   fazilat: "মাগরিবের পর ৬ রাকাত আওয়াবিন পড়লে ১২ বছরের ইবাদতের সওয়াব",
   hadith: "মাগরিবের নামাজ দেরি করো না, ইফতারে দেরি করো না",
   quran: "সূর্যাস্তের পর থেকে রাতের অন্ধকার পর্যন্ত নামাজ কায়েম করো - বনী ইসরাঈল ৭৮",
   rakat: "৩ ফরজ + ২ সুন্নত + ২ নফল"
 },
 { 
   name: "এশা", time: "20:10", emoji: "🌙", //8:10
   desc: "রাতের নামাজ",
   fazilat: "এশা ও ফজর জামাতে পড়লে সারারাত ইবাদতের সওয়াব",
   hadith: "মুনাফিকদের জন্য এশা ও ফজর সবচেয়ে কষ্টকর",
   quran: "রাতের কিছু অংশে তাহাজ্জুদ পড়ো, তোমার জন্য অতিরিক্ত - বনী ইসরাঈল ৭৯",
   rakat: "৪ সুন্নত + ৪ ফরজ + ২ সুন্নত + ২ নফল + ৩ বিতর"
 }
];

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const BN_DAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const BN_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

const SAVE_FILE = path.join(process.cwd(), "data", "namaz.json");
const IMAGE_URL = "https://drive.google.com/uc?export=view&id=1mALgzFRDpv44v-jzbBgMTt5sPo3pzmhc";
const CACHE_IMAGE_PATH = path.join(process.cwd(), "data", "cache_namaz2_image.jpg");

function getStatus(){ try{ if(fs.existsSync(SAVE_FILE)){ return JSON.parse(fs.readFileSync(SAVE_FILE,'utf8')).enabled; } }catch{} return true; }
function saveStatus(e){ try{ const d=path.dirname(SAVE_FILE); if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); fs.writeFileSync(SAVE_FILE, JSON.stringify({enabled:e}, null, 2)); }catch{} }
function toBanglaNum(n){ return String(n).replace(/[0-9]/g, d => BN_DIGITS[+d]); }
function convertTo12Hour(t){ const [h,m]=t.split(":"); let hh=parseInt(h); const ampm=hh>=12?"PM":"AM"; hh=hh%12||12; return `${toBanglaNum(hh)}:${toBanglaNum(m)} ${ampm}`; }

async function downloadImage(){
  try{
    if(fs.existsSync(CACHE_IMAGE_PATH) && fs.statSync(CACHE_IMAGE_PATH).size > 1000) return;
    const r = await axios({ 
      method: "GET", 
      url: IMAGE_URL, 
      responseType: "stream", 
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' } 
    });
    const w = fs.createWriteStream(CACHE_IMAGE_PATH);
    r.data.pipe(w);
    await new Promise((res, rej)=>{ w.on("finish", res); w.on("error", rej); });
  }catch{}
}

function buildScheduleMsg(){
  const now = moment.tz("Asia/Dhaka");
  const date = toBanglaNum(now.format("DD"))+" "+BN_MONTHS[now.month()]+" "+toBanglaNum(now.format("YYYY"));
  const day = BN_DAYS[now.day()];
  let list = `╔════════════════════════╗
║  🕌 ﷽ - বিসমিল্লাহির রহমানির রহিম 🕌  ║
╚════════════════════════╝

🌙 আসসালামু আলাইকুম ওয়া রহমাতুল্লাহ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 স্থান: বাংলাদেশ (ঢাকা)
📅 তারিখ: ${date} | ${day}
🕋 হিজরি: ${toBanglaNum(now.format("DD"))} ${BN_MONTHS[now.month()]} (আনুমানিক)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🕌 পাঁচ ওয়াক্ত নামাজের সময়সূচী 🕌
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  for(const p of PRAYER_TIMES){
    list += `${p.emoji} ${p.name} - ${convertTo12Hour(p.time)}\n`;
    list += `   ├─ ${p.desc} | ${p.rakat}\n`;
    list += `   └─ ফজিলত: ${p.fazilat.slice(0,45)}...\n\n`;
  }

  list += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 রাসূল ﷺ বলেছেন: "নামাজ বেহেশতের চাবি"
📖 আল্লাহ বলেন: "নিশ্চয়ই নামাজ অশ্লীলতা থেকে বাঁচায়"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔔 বট প্রতি ওয়াক্তে অটো আজান দিবে ইনশাআল্লাহ
⚙️ কন্ট্রোল: /namaz on | /namaz off



🤲 আল্লাহ আমাদের সবাইকে ৫ ওয়াক্ত নামাজী বানিয়ে দিন - আমিন 🤲`;
  return list;
}

async function getAllGroups(){
  try{
    if(global.db && global.db.getAllThreads){
      const threads = await global.db.getAllThreads();
      return threads.filter(t => t.type==='group' || t.type==='supergroup' || String(t.id).startsWith('-')).map(t=>t.id);
    }
    if(global.data?.allThreadID) return global.data.allThreadID;
    return [];
  }catch{ return []; }
}

async function sendPrayerAlert(p){
  if(!getStatus()) return;
  const api = global.bot || global.api;
  if(!api) return;
  const now = moment.tz("Asia/Dhaka");
  const banglaTime = convertTo12Hour(p.time);
  const date = toBanglaNum(now.format("DD"))+" "+BN_MONTHS[now.month()]+" "+toBanglaNum(now.format("YYYY"));
  const day = BN_DAYS[now.day()];

  const msgText = `╔════════════════════════════╗
║  🕌 ﷽ - নামাজের সময় হয়েছে 🕌  ║
╚════════════════════════════╝

${p.emoji} ${p.name} এর আজান হচ্ছে - ${banglaTime}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ ওয়াক্ত: ${banglaTime}
📅 তারিখ: ${date} | ${day}
📖 নামাজ: ${p.desc}
🕌 রাকাত: ${p.rakat}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 ফজিলত:
${p.fazilat}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 হাদিস:
"${p.hadith}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 কুরআন:
"${p.quran}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤲 দোয়া:
اللهم اجعلني مقيم الصلاة ومن ذريتي
"হে আল্লাহ! আমাকে নামাজ কায়েমকারী বানাও এবং আমাদের বংশধরদেরও"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕋 আসুন সবাই জামাতে নামাজ আদায় করি
💚 আল্লাহ আমাদের নামাজ কবুল করুন - আমিন
`;

  console.log(`[NAMAZ] Sending ${p.name}`);
  await downloadImage();
  const threads = await getAllGroups();
  
  for(const tid of threads){
    setTimeout(async () => {
      try{
        if(fs.existsSync(CACHE_IMAGE_PATH) && fs.statSync(CACHE_IMAGE_PATH).size > 1000){
          await api.sendPhoto(tid, { source: CACHE_IMAGE_PATH }, { caption: msgText }).catch(async()=>{
            await api.sendMessage(tid, msgText).catch(()=>{});
          });
        }else{
          await api.sendMessage(tid, msgText).catch(()=>{});
        }
      }catch{}
    }, 500);
  }
}

function schedulePrayers(){
  const now = moment.tz("Asia/Dhaka");
  if(global.namazTimers) global.namazTimers.forEach(t=>clearTimeout(t));
  global.namazTimers = [];
  for(const prayer of PRAYER_TIMES){
    const [h,m]=prayer.time.split(":");
    let pt = moment.tz("Asia/Dhaka").hour(parseInt(h)).minute(parseInt(m)).second(0);
    if(pt.isBefore(now)) pt = pt.add(1, "day");
    const msUntil = pt.diff(now);
    const timer = setTimeout(()=>{
      sendPrayerAlert(prayer);
      const daily = setInterval(()=>sendPrayerAlert(prayer), 86400000);
      global.namazTimers.push(daily);
    }, msUntil);
    global.namazTimers.push(timer);
  }
}

function startNamazSystem(){
  if(global.namazMidnightTimer) clearInterval(global.namazMidnightTimer);
  if(!getStatus()) return;
  schedulePrayers();
  const now = moment.tz("Asia/Dhaka");
  let nextMidnight = moment.tz("Asia/Dhaka").add(1, "day").startOf("day").add(1, "minute");
  const msUntilMidnight = nextMidnight.diff(now);
  setTimeout(()=>{
    schedulePrayers();
    global.namazMidnightTimer = setInterval(()=>schedulePrayers(), 86400000);
  }, msUntilMidnight);
}

function stopNamazSystem(){
  if(global.namazTimers) global.namazTimers.forEach(t=>clearTimeout(t));
  if(global.namazMidnightTimer) clearInterval(global.namazMidnightTimer);
  global.namazTimers = []; global.namazMidnightTimer = null;
}

if(!global.namazStarted){
  global.namazStarted = true;
  const waitBot = ()=>{
    if(global.bot || global.api){
      if(getStatus()){ downloadImage(); startNamazSystem(); }
      console.log("[NAMAZ PREMIUM] Loaded - "+(getStatus()?"ON":"OFF")+" - IMAGE MODE");
    }else setTimeout(waitBot, 3000);
  };
  waitBot();
}

module.exports = {
  config: {
    name: "namaz",
    aliases: ["prayer", "azan", "islamic"],
    author: "MOHAMMAD BADOL",
    version: "6.2 PREMIUM FIXED",
    role: 0,
    cooldown: 5,
    description: "Premium Islamic Namaz Alert System",
    category: "islamic",
    usePrefix: true
  },
  BADOL: async function({ event, api, args }){
    const chatId = event.chat.id;
    const action = args[0]?.toLowerCase();
    const isAdmin = String(event.from?.id) === "6954597258" || global.config?.ownerInfo?.botAdmins?.map(String).includes(String(event.from?.id));

    if(action === "off"){
      if(!isAdmin) return api.sendMessage(chatId, "❌ শুধু Admin!");
      saveStatus(false); stopNamazSystem();
      return api.sendMessage(chatId, `╔══════════════════╗\n║ ❌ OFF - নামাজ এলার্ট বন্ধ ❌ ║\n╚══════════════════╝\n\n🔕 অটো আজান বন্ধ হয়েছে\n💡 চালু: /namaz on`);
    }
    if(action === "on"){
      if(!isAdmin) return api.sendMessage(chatId, "❌ শুধু Admin!");
      saveStatus(true); startNamazSystem();
      return api.sendMessage(chatId, `╔══════════════════╗\n║ ✅ ON - নামাজ এলার্ট চালু ✅ ║\n╚══════════════════╝\n\n🔔 প্রতি ওয়াক্তে আজান যাবে ইনশাআল্লাহ\n💡 বন্ধ: /namaz off`);
    }

    const status = getStatus()? "✅ চালু আছে" : "❌ বন্ধ আছে";
    const msg = buildScheduleMsg() + `\n\n📊 স্ট্যাটাস: ${status}`;
    try{
      if(fs.existsSync(CACHE_IMAGE_PATH) && fs.statSync(CACHE_IMAGE_PATH).size > 1000){
        await api.sendPhoto(chatId, { source: CACHE_IMAGE_PATH }, { caption: msg });
      }else{
        await downloadImage();
        if(fs.existsSync(CACHE_IMAGE_PATH) && fs.statSync(CACHE_IMAGE_PATH).size > 1000){
          await api.sendPhoto(chatId, { source: CACHE_IMAGE_PATH }, { caption: msg });
        }else{ await api.sendMessage(chatId, msg); }
      }
    }catch{ await api.sendMessage(chatId, msg); }
  }
};
