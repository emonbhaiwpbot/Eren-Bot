/**
 * 🤖 BADOL-BOT AGE CALCULATOR
 * 👤 AUTHOR: MOHAMMAD BADOL
 */

module.exports = {
  config: {
    name: "age",
    aliases: ["myage", "boyos"],
    author: "MOHAMMAD BADOL",
    version: "3.0-BADOL",
    cooldown: 5,
    role: 0,
    description: "Calculate exact age with details + pfp",
    category: "utility",
    usePrefix: true
  },

  BADOL: async function ({ event, api, args, message, chatId, userId }) {
    try {
      let input = args.join(" ").trim();

      if (!input) {
        return message.reply(
          "⚠️ **আপনার জন্মতারিখ দিন!**\n" +
          "━━━━━━━━━━━━━━━━━━━━\n" +
          "💡 উদাহরণ: `/age 06-01-1998`\n" +
          "💡 `/age 06/01/1998`"
        );
      }

      let parts = input.split(/[-\/.]/);
      if (parts.length!== 3) {
        return message.reply("❌ **ভুল ফরম্যাট!** তারিখ দিন: `DD-MM-YYYY`");
      }

      let d = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10);
      let y = parseInt(parts[2], 10);

      let birthDate = new Date(y, m - 1, d);
      let now = new Date();

      if (isNaN(birthDate.getTime()) || birthDate > now || d > 31 || m > 12 || y < 1900) {
        return message.reply("❌ **সঠিক জন্মতারিখ দিন!** ভবিষ্যতের তারিখ হবে না।");
      }

      // বয়স বছর মাস দিন
      let years = now.getFullYear() - birthDate.getFullYear();
      let months = now.getMonth() - birthDate.getMonth();
      let days = now.getDate() - birthDate.getDate();

      if (days < 0) {
        let lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += lastMonth.getDate();
        months--;
      }
      if (months < 0) {
        years--;
        months += 12;
      }

      // ডিটেইলস
      let diffMs = now - birthDate;
      let totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      let totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      let totalMinutes = Math.floor(diffMs / (1000 * 60));
      let totalSeconds = Math.floor(diffMs / 1000);

      // পরবর্তী জন্মদিন
      let nextBD = new Date(now.getFullYear(), m - 1, d);
      if (now > nextBD) nextBD.setFullYear(now.getFullYear() + 1);
      let diffNextBD = nextBD - now;
      let leftDays = Math.floor(diffNextBD / (1000 * 60 * 60 * 24));
      let leftHours = Math.floor((diffNextBD % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      let leftMinutes = Math.floor((diffNextBD % (1000 * 60 * 60)) / (1000 * 60));

      const weekdays = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
      const monthsBangla = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

      let caption = `🎉 **আপনার বয়সের বিস্তারিত তথ্য**\n`;
      caption += `━━━━━━━━━━━━━━━━━━━━\n`;
      caption += `👤 **ইউজার:** ${event.from.first_name}\n`;
      caption += `🎂 **জন্ম তারিখ:** ${d} ${monthsBangla[m-1]} ${y} (${weekdays[birthDate.getDay()]})\n`;
      caption += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      caption += `📌 **বর্তমান বয়স:**\n`;
      caption += `┗ **${years} বছর, ${months} মাস, ${days} দিন**\n\n`;
      caption += `⏳ **পরবর্তী জন্মদিন:**\n`;
      caption += `┗ ${nextBD.getDate()} ${monthsBangla[nextBD.getMonth()]} (${weekdays[nextBD.getDay()]})\n`;
      caption += `┗ বাকি: **${leftDays} দিন, ${leftHours} ঘণ্টা, ${leftMinutes} মিনিট**\n\n`;
      caption += `📊 **মোট অতিক্রান্ত সময়:**\n`;
      caption += `┗ মোট দিন: ${totalDays.toLocaleString()}\n`;
      caption += `┗ মোট ঘণ্টা: ${totalHours.toLocaleString()}\n`;
      caption += `┗ মোট মিনিট: ${totalMinutes.toLocaleString()}\n`;
      caption += `┗ মোট সেকেন্ড: ${totalSeconds.toLocaleString()}\n`;
      caption += `━━━━━━━━━━━━━━━━━━━━\n`;
      caption += `🛡️ **Credit:** MOHAMMAD BADOL`;

      // ইউজারের PFP সহ পাঠাও
      try {
        let photos = await api.getUserProfilePhotos(userId, { limit: 1 });
        if (photos.total_count > 0) {
          const fileId = photos.photos[0][0].file_id;
          return await api.sendPhoto(chatId, fileId, {
            caption: caption,
            parse_mode: "Markdown"
          });
        } else {
          return await message.reply(caption);
        }
      } catch (e) {
        // PFP ফেল করলে শুধু টেক্সট
        return await message.reply(caption);
      }

    } catch (err) {
      console.log("age error:", err.message);
      return message.reply(`❌ Error: ${err.message}`);
    }
  }
};