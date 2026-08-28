const fs = require('fs');
const path = require('path');
const util = require('util');

module.exports = {
  config: {
    name: "eval",
    aliases: ["ev", "exec", "run", "execute"],
    author: "MOHAMMAD BADOL",
    version: "10.0-PREMIUM-GOAT",
    role: 2,
    category: "owner",
    description: "Premium Eval - Run code, check error, create command",
    usePrefix: true,
    cooldown: 2
  },

  BADOL: async function({ api, chatId, event, args, message, BADOL }) {
    const chat = chatId || event.chat.id;
    const input = args.join(" ").trim();

    if(!input){
      return message.reply(
`💎 𝗣𝗥𝗘𝗠𝗜𝗨𝗠 𝗘𝗩𝗔𝗟 𝗩10 - 𝗘𝗥𝗘𝗡-𝗔𝗜

📌 Usage:
• /eval console.log(global.config) - Code run
• /eval --cmd test - Command create
• /eval --del test - Command delete
• /eval --list - Command list
• /eval --check admin - Command check
• /eval --file config.js - File read
• /eval --err - Last error check

🔧 Variables Available:
api, chatId, event, global, global.db, global.config, global.badol, fs, path

👑 Owner Only`
      );
    }

    // --list
    if(input === "--list" || input === "--ls"){
      try{
        const cmds = [...(global.badol.commands?.keys() || [])].sort();
        return message.reply(`📦 Total Commands: ${cmds.length}\n\n${cmds.join(", ")}`);
      }catch(e){ return message.reply(`❌ ${e.message}`); }
    }

    // --del command
    if(input.startsWith("--del ") || input.startsWith("--delete ")){
      const name = input.split(" ")[1]?.toLowerCase();
      if(!name) return message.reply("❌ Name দাও: /eval --del test");
      const cmdPath = path.join(__dirname, `${name}.js`);
      if(fs.existsSync(cmdPath)){
        fs.unlinkSync(cmdPath);
        if(global.badol.commands) global.badol.commands.delete(name);
        return message.reply(`✅ Command Deleted: ${name}.js`);
      } else return message.reply(`❌ Not found: ${name}.js`);
    }

    // --check command
    if(input.startsWith("--check ")){
      const name = input.split(" ")[1]?.toLowerCase();
      if(!name) return message.reply("❌ Name দাও: /eval --check admin");
      try{
        const cmd = global.badol.commands?.get(name);
        if(!cmd) return message.reply(`❌ Command not found: ${name}`);
        const info = `
╭─❖─〔 CHECK: ${name} 〕─❖─╮
│ Name: ${cmd.config.name}
│ Version: ${cmd.config.version}
│ Author: ${cmd.config.author}
│ Role: ${cmd.config.role}
│ Category: ${cmd.config.category}
│ Aliases: ${cmd.config.aliases?.join(", ") || "None"}
│ Cooldown: ${cmd.config.cooldown}
│ Path: BADOL-CMDS/cmds/${name}.js
╰──────────────────╯
Code Preview:
${fs.readFileSync(path.join(__dirname, `${name}.js`), "utf8").slice(0, 1500)}...
`;
        return message.reply(info);
      }catch(e){ return message.reply(`❌ Check Error: ${e.message}`); }
    }

    // --file read
    if(input.startsWith("--file ")){
      const f = input.split(" ")[1];
      const p = path.join(__dirname, "../../", f);
      if(!fs.existsSync(p)) return message.reply(`❌ File not found: ${f}`);
      const data = fs.readFileSync(p, "utf8").slice(0, 4000);
      return message.reply(`📄 ${f}:\n\n${data}`);
    }

    // --err last error
    if(input === "--err"){
      const err = global._lastError || "No error saved!";
      return message.reply(`⚠️ Last Error:\n${util.format(err).slice(0, 3500)}`);
    }

    // --cmd create command - Goat style
    if(input.startsWith("--cmd ")){
      // format: /eval --cmd test console.log("hi")
      const parts = input.split(" ");
      const cmdName = parts[1]?.toLowerCase();
      const code = parts.slice(2).join(" ");
      if(!cmdName) return message.reply("❌ Usage: /eval --cmd <name> <code>\nEx: /eval --cmd test api.sendMessage(chatId, 'Hi')");
      const cmdPath = path.join(__dirname, `${cmdName}.js`);
      const template = `module.exports = {
  config: {
    name: "${cmdName}",
    author: "MOHAMMAD BADOL via Eval",
    version: "1.0",
    role: 0,
    category: "eval",
    description: "Created by eval",
    usePrefix: true,
    cooldown: 3
  },
  BADOL: async function({ api, chatId, event, args, message }){
    try{
      ${code || "await api.sendMessage(chatId, 'Hello from "+cmdName+"');"}
    }catch(e){
      await message.reply("❌ Error: " + e.message);
    }
  }
};`;
      try{
        fs.writeFileSync(cmdPath, template, "utf8");
        // hot reload
        delete require.cache[require.resolve(cmdPath)];
        const newCmd = require(cmdPath);
        if(global.badol.commands) global.badol.commands.set(cmdName, newCmd);
        return message.reply(`✅ Command Created: ${cmdName}.js\nPath: BADOL-CMDS/cmds/${cmdName}.js\nReloaded!`);
      }catch(e){ return message.reply(`❌ Create Failed: ${e.message}`); }
    }

    // MAIN EVAL EXECUTION
    let output = "";
    const start = Date.now();
    try{
      // Context for eval
      const context = {
        api, chatId: chat, event, args, message,
        global, db: global.db, config: global.config,
        fs, path, util,
        bot: global.badol,
        chatIdStr: String(chat)
      };

      let code = input;
      // support async/await automatically
      const result = await eval(`(async () => { ${code} })()`);

      const time = Date.now() - start;
      let resStr = "";
      if(result!== undefined){
        resStr = typeof result === "object"? util.inspect(result, { depth: 3 }) : String(result);
      }

      output = `✅ 𝗘𝗩𝗔𝗟 𝗦𝗨𝗖𝗘𝗦 (${time}ms)\n━━━━━━━━━━━━━━━\n📥 Input:\n${input.slice(0, 1000)}\n━━━━━━━━━━━━━━━\n📤 Output:\n${resStr || "No return (code executed)"}`;

    }catch(e){
      global._lastError = e;
      const time = Date.now() - start;
      output = `❌ 𝗘𝗩𝗔𝗟 𝗘𝗥𝗥𝗢𝗥 (${time}ms)\n━━━━━━━━━━━━━━━\n📥 Input:\n${input.slice(0, 1000)}\n━━━━━━━━━━━━━━━\n⚠️ Error:\n${e.name}: ${e.message}\n\nStack:\n${e.stack?.slice(0, 1500)}`;
    }

    // If too long, send as file
    if(output.length > 3800){
      const filePath = path.join(__dirname, "../../cache/eval_output.txt");
      try{
        if(!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, output, "utf8");
        await api.sendDocument(chat, filePath, { caption: "📄 Eval output too long - sent as file" });
        fs.unlinkSync(filePath);
      }catch{
        return message.reply(output.slice(0, 3800));
      }
    } else {
      return message.reply(output);
    }
  }
};