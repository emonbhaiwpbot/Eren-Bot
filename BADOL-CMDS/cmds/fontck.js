const fs = require('fs');
const path = require('path');
const { createCanvas, registerFont } = require("canvas");

const fontConfigs = {
  "fontck": { file: "Badol_1.ttf", family: "Badol_1" },
  "fontck2": { file: "Badol_2.ttf", family: "Badol_2" },
  "fontck3": { file: "Badol_3.ttf", family: "Badol_3" }
};

const fontsDir = path.join(__dirname, 'BADOL');

Object.values(fontConfigs).forEach(f => {
  let fp = path.join(fontsDir, f.file);
  if(!fs.existsSync(fp)) fp = path.join(__dirname, f.file);
  if(!fs.existsSync(fp)) fp = path.join(__dirname, 'BADOL', f.file);
  if (fs.existsSync(fp)) {
    try { registerFont(fp, { family: f.family }); console.log(`[FONT] ${f.family} Loaded`); } catch(e){}
  }
});

module.exports = {
  config: {
    name: "fontck",
    aliases: ["fontck2", "fontck3"],
    author: "MOHAMMAD BADOL",
    version: "3.2 REAL CMD DETECT",
    cooldown: 3,
    role: 0,
    category: "canvas",
    usePrefix: true
  },

  BADOL: async function ({ event, api, args, message }) {
    const prefix = global.config?.botInfo?.prefix || "/";
    const rawText = (event.text || "").trim();

    // 🔥 আসল Command বের কর - event.text থেকে!
    let usedCmd = "fontck";
    if(rawText.startsWith(prefix)){
      usedCmd = rawText.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();
    } else {
      usedCmd = rawText.split(/ +/)[0].toLowerCase();
    }

    // যদি alias না মিলে তাহলে fontck
    if(!fontConfigs[usedCmd]) usedCmd = "fontck";

    const cfg = fontConfigs[usedCmd];
    const userText = args.join(" ").trim();

    console.log(`[DEBUG] Raw: ${rawText} | UsedCmd: ${usedCmd} | Font: ${cfg.family}`);

    if (!userText) return message.reply(`Ex: ${prefix}${usedCmd} আসসালামু আলাইকুম`);

    let imgPath;
    try {
        const canvas = createCanvas(1000, 500);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, 1000, 500);

        const borderGlow = ctx.createLinearGradient(0, 0, 1000, 0);
        if(usedCmd === "fontck"){ borderGlow.addColorStop(0, '#ff0000'); borderGlow.addColorStop(1, '#ffff00'); }
        if(usedCmd === "fontck2"){ borderGlow.addColorStop(0, '#00ff00'); borderGlow.addColorStop(1, '#00ffff'); }
        if(usedCmd === "fontck3"){ borderGlow.addColorStop(0, '#ff00ff'); borderGlow.addColorStop(1, '#ffff00'); }

        ctx.strokeStyle = borderGlow;
        ctx.lineWidth = 10;
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 20;
        ctx.strokeRect(15, 15, 970, 470);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 35;
        ctx.fillStyle = "#ffffff";

        let fontSize = 75;
        if (userText.length > 25) fontSize = 55;
        if (userText.length > 50) fontSize = 40;

        // 🔥 Real Font
        ctx.font = `bold ${fontSize}px "${cfg.family}"`;

        const maxW = 850;
        let lines = []; let words = userText.split(" "); let cur = words[0]||"";
        for(let i=1;i<words.length;i++){
          if(ctx.measureText(cur+" "+words[i]).width < maxW) cur += " "+words[i];
          else { lines.push(cur); cur = words[i]; }
        }
        lines.push(cur);
        const lh = fontSize*1.2;
        let startY = 250 - ((lines.length-1)*lh)/2;
        lines.forEach((l,i)=> ctx.fillText(l, 500, startY + i*lh));

        ctx.shadowBlur = 0;
        ctx.font = "bold 22px Arial";
        ctx.fillStyle = "#ffff00";
        ctx.fillText(`FONT: ${cfg.family} - ${cfg.file}`, 500, 440);

        const dir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        imgPath = path.join(dir, `font_${usedCmd}_${Date.now()}.png`);
        fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

        await api.sendPhoto(event.chat.id, { source: fs.createReadStream(imgPath) }, {
          caption: `✅ Font: ${cfg.family}\n📝 Text: ${userText}\n🎨 Command: ${usedCmd} | File: ${cfg.file}`
        });

    } catch (e) {
        console.log(e);
        return message.reply(`❌ ${e.message}`);
    } finally {
        if (imgPath && fs.existsSync(imgPath)) setTimeout(()=>{ try { fs.unlinkSync(imgPath); } catch{} }, 1000);
    }
  }
};