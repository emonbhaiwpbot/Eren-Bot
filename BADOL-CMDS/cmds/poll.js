// ╔════════════════════════════════════════════════════╗
// ║ BADOL-CMDS/cmds/poll.js - V8.6 FIXED ║
// ║ FIXED: msg undefined, event based handler ║
// ╚════════════════════════════════════════════════════╝

const fs = require('fs');
const path = require('path');

const POLL_PATH = path.join(__dirname, "../../data/polls.json");

function getPolls() {
  try {
    if (!fs.existsSync(POLL_PATH)) fs.writeFileSync(POLL_PATH, JSON.stringify({}, null, 2));
    return JSON.parse(fs.readFileSync(POLL_PATH, 'utf8'));
  } catch { return {}; }
}
function savePolls(data) {
  try { fs.writeFileSync(POLL_PATH, JSON.stringify(data, null, 2)); } catch {}
}

module.exports = {
  config: {
    name: "poll",
    aliases: ["vote", "polls"],
    author: "MOHAMMAD BADOL",
    version: "8.6",
    description: "Poll with | and - separator - V8.6 Fixed",
    category: "utility",
    usePrefix: true,
    role: 0,
    cooldown: 5
  },

  // ✅ FIXED FOR V8.6 HANDLER
  BADOL: async function({ api, chatId, userId, event, args, ctx }) {
    // V8.6 Handler থেকে sender নেয়ার সঠিক নিয়ম
    const senderId = userId || event?.from?.id || ctx?.from?.id || 0;
    const chat = chatId || event?.chat?.id || ctx?.chat?.id;

    // args V8.6 তে /poll বাদ দিয়েই আসে
    const rawText = (args || []).join(" ").trim();

    if (!rawText) {
      return api.sendMessage(chat,
`╭─❖─〔 Poll Create 〕─❖─╮
│
│ 2 ভাবে বানাও:
│ /poll প্রশ্ন | Opt1 | Opt2
│ /poll প্রশ্ন - Opt1 - Opt2
│
│ Ex:
│ /poll Best Bot? - BADOL - Mirza
╰─❖─〔 Eren-AI 〕─❖─╯
`);
    }

    let parts = [];
    if (rawText.includes("|")) {
      parts = rawText.split("|").map(s => s.trim()).filter(s => s);
    } else if (rawText.includes(" - ")) {
      parts = rawText.split(" - ").map(s => s.trim()).filter(s => s);
    } else if (rawText.includes("-")) {
      // যাতে প্রশ্নের ভিতরের - ভাঙে না যায়, প্রথম - কে আলাদা handle
      // কিন্তু Fallback হিসাবে -
      parts = rawText.split("-").map(s => s.trim()).filter(s => s);
    }

    if (parts.length < 3) {
      return api.sendMessage(chat, `❌ কমপক্ষে 2 টা Option লাগবে!\n\n✅ Ex:\n/poll Best Game? - Free Fire - PUBG\n/poll Best Game? | Free Fire | PUBG`);
    }

    const question = parts[0];
    const options = parts.slice(1).slice(0, 8);

    const pollId = Date.now().toString();
    const polls = getPolls();

    polls[pollId] = {
      question,
      options: options.map(name => ({ name, votes: 0 })),
      voters: {},
      creatorId: senderId,
      chatId: chat,
      createdAt: new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })
    };
    savePolls(polls);

    const { text, keyboard } = buildPollContent(polls[pollId], pollId);
    try {
      await api.sendMessage(chat, text, { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
    } catch (e) {
      console.log("Poll Send Error:", e.message);
      await api.sendMessage(chat, text).catch(()=>{});
    }
  },

  // ✅ FIXED FOR V8.6 CALLBACK
  onCallback: async function({ event, api, ctx }) {
    // V8.6 এ event = query (callbackQuery)
    const query = event;
    const data = query?.data || query?.callback_query?.data;
    if (!data ||!data.startsWith("poll_")) return;

    const parts = data.split("_");
    const pollId = parts[1];
    const optIndex = parseInt(parts[2]);

    const polls = getPolls();
    const poll = polls[pollId];
    if (!poll) {
      try { await ctx.answerCbQuery("❌ Poll Expired!", { show_alert: true }); } catch {}
      return;
    }

    const userId = String(query.from.id);
    const oldVote = poll.voters[userId];

    if (oldVote === optIndex) {
      poll.options[optIndex].votes--;
      delete poll.voters[userId];
      try { await ctx.answerCbQuery(`❌ Vote Removed!`); } catch {}
    } else {
      if (oldVote!== undefined) poll.options[oldVote].votes = Math.max(0, poll.options[oldVote].votes - 1);
      poll.options[optIndex].votes++;
      poll.voters[userId] = optIndex;
      try { await ctx.answerCbQuery(`✅ Voted: ${poll.options[optIndex].name}`); } catch {}
    }

    savePolls(polls);
    const { text, keyboard } = buildPollContent(poll, pollId);
    try {
      await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: { inline_keyboard: keyboard } });
    } catch {}
  }
};

function buildPollContent(poll, pollId) {
  const totalVotes = poll.options.reduce((a, b) => a + b.votes, 0);
  let text = `📊 <b>${poll.question}</b>\n━━━━━━━━━━━━━━━━━━\n\n`;
  poll.options.forEach((opt, i) => {
    const percent = totalVotes === 0? 0 : Math.round((opt.votes / totalVotes) * 100);
    const filled = Math.round(percent / 10);
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);
    text += `${i + 1}. <b>${opt.name}</b>\n ${bar} ${percent}% (${opt.votes} vote)\n\n`;
  });
  text += `━━━━━━━━━━━━━━━━━━\n🗳️ Total Votes: ${totalVotes} জন\n💡 Button চেপে Vote দাও!`;

  const keyboard = poll.options.map((opt, i) => {
    const percent = totalVotes === 0? 0 : Math.round((opt.votes / totalVotes) * 100);
    return [{ text: `${opt.name} [${opt.votes} - ${percent}%]`, callback_data: `poll_${pollId}_${i}` }];
  });

  return { text, keyboard };
}