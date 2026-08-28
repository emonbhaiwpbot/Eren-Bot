const { createCanvas } = require("canvas");

const engToBn = num => {
    const bnDigits = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];
    return num.toString().replace(/\d/g, d => bnDigits[d]);
};

module.exports = {
    config: {
        name: "time",
        aliases: ["calendar", "cal", "date"],
        version: "9.1 SYNTAX FIXED",
        author: "MOHAMMAD BADOL",
        role: 0,
        cooldown: 5,
        description: "Full info + Real BD Time - Fixed",
        category: "utility",
        usePrefix: true
    },

    BADOL: async function({ event, api, ctx }){
        const chatId = event.chat.id;
        const telegram = api || ctx.telegram;
        try {
            const moment = require('moment-timezone');
            const dhaka = moment().tz('Asia/Dhaka');
            const now = dhaka.toDate();

            const currentDay = dhaka.date();
            const currentMonth = dhaka.month();
            const currentYear = dhaka.year();
            const hour24 = dhaka.hour();
            const minute = dhaka.minute();
            const second = dhaka.second();
            const dayOfWeek = dhaka.day();

            function getTimePeriod(h){
                if(h>=5 && h<12) return {emoji:"🌅",label:"সকাল"};
                if(h>=12 && h<15) return {emoji:"🌞",label:"দুপুর"};
                if(h>=15 && h<18) return {emoji:"🌇",label:"বিকাল"};
                if(h>=18 && h<20) return {emoji:"🌆",label:"সন্ধ্যা"};
                return {emoji:"🌃",label:"রাত"};
            }
            const timeInfo = getTimePeriod(hour24);
            const hour12 = hour24 % 12 || 12;
            const ampm = hour24 >= 12? "PM" : "AM";

            const width=600, height=740;
            const canvas=createCanvas(width,height);
            const c=canvas.getContext("2d");

            const grad=c.createLinearGradient(0,0,width,height);
            grad.addColorStop(0,"#020111");
            grad.addColorStop(1,"#191970");
            c.fillStyle=grad;
            c.fillRect(0,0,width,height);
            c.strokeStyle="rgba(255,215,0,0.3)";
            c.lineWidth=15;
            c.strokeRect(10,10,width-20,height-20);

            const monthNamesEng=["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
            c.fillStyle="#FFD700"; c.font="bold 50px sans-serif"; c.textAlign="center";
            c.fillText(monthNamesEng[currentMonth], width/2, 90);
            c.font="30px sans-serif"; c.fillText(currentYear, width/2, 130);

            const daysNameShort=["SUN","MON","TUE","WED","THU","FRI","SAT"];
            c.fillStyle="#00FFFF"; c.font="bold 20px sans-serif";
            daysNameShort.forEach((d,i)=>{ c.fillText(d,65+i*78,200); });

            const firstDay=new Date(currentYear,currentMonth,1).getDay();
            const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
            let x=65+(firstDay*78), y=270;
            for(let d=1; d<=daysInMonth; d++){
                if(d===currentDay){
                    c.fillStyle="red";
                    c.beginPath();
                    c.arc(x,y-10,30,0,Math.PI*2);
                    c.fill();
                    c.fillStyle="#FFFFFF";
                }else{
                    c.fillStyle="#FFFFFF";
                }
                c.font="bold 28px sans-serif";
                c.fillText(d.toString(),x,y);
                x+=78;
                if(x>550){ x=65; y+=80; }
            }

            c.textAlign="center";
            c.fillStyle="#00FFCC"; c.font="bold 22px sans-serif";
            c.fillText("Bot Name: Eren-AI", width/2, height-70);
            c.fillStyle="#FFD700"; c.font="bold 20px sans-serif";
            c.fillText("Bot Developer: MOHAMMAD-BADOL", width/2, height-40);

            const bnMonths=["বৈশাখ","জ্যৈষ্ঠ","আষাঢ়","শ্রাবণ","ভাদ্র","আশ্বিন","কার্তিক","অগ্রহায়ণ","পৌষ","মাঘ","ফাল্গুন","চৈত্র"];
            const daysBn=["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"];

            let bsYear=currentYear-593;
            let bsStart=new Date(currentYear,3,14);
            if(now<bsStart){
                bsYear--;
                bsStart.setFullYear(bsStart.getFullYear()-1);
            }
            let diff=Math.floor((now-bsStart)/86400000);
            const isLeap=(currentYear%4===0 && currentYear%100!==0) || (currentYear%400===0);
            const mLen=[31,31,31,31,31,30,30,isLeap?31:30];
            let bDay=1,bMonth=0;
            for(let i=0;i<12;i++){
                if(diff<mLen[i]){ bDay=diff+1; bMonth=i; break; }
                diff-=mLen[i];
            }

            function hijriDate(gDate){
                let jd=Math.floor((gDate/86400000)-(gDate.getTimezoneOffset()/1440)+2440587.5);
                let l=jd-1948440+10632;
                let n=Math.floor((l-1)/10631);
                l=l-10631*n+354;
                let j=Math.floor((10985-l)/5316)*Math.floor((50*l)/17719)+Math.floor(l/5670)*Math.floor((43*l)/15238);
                l=l-Math.floor((30-j)/15)*Math.floor((17719*j)/50)-Math.floor(j/16)*Math.floor((15238*j)/43)+29;
                let m=Math.floor((24*l)/709);
                let d=l-Math.floor((709*m)/24);
                let y=30*n+j-30;
                return {year:y, month:m-1, day:d};
            }
            const hDate=hijriDate(now);
            const arMonths=["মুহররম","সফর","রবিউল আওয়াল","রবিউস সানি","জুমাদিউল আউয়াল","জুমাদিউস সানি","রজব","শাবান","রমজান","শাওয়াল","জিলক্বদ","জিলহজ"];
            const prayer={t:"০৩:৩০",f:"০৫:২৫",d:"১২:১০",a:"০৩:৫০",m:"০৫:৩০",i:"০৬:৫০",j:"১২:৪৫"};
            const sep="▬▬▬▬";
            const monthsList=["১ জানুয়ারি (January)","২ ফেব্রুয়ারি (February)","৩ মার্চ (March)","৪ এপ্রিল (April)","৫ মে (May)","৬ জুন (June)","৭ জুলাই (July)","৮ আগস্ট (August)","৯ সেপ্টেম্বর (September)","১০ অক্টোবর (October)","১১ নভেম্বর (November)","১২ ডিসেম্বর (December)"].join("\n");
            const timeStrBn=engToBn(hour12)+":"+engToBn(minute.toString().padStart(2,'0'))+":"+engToBn(second.toString().padStart(2,'0'))+" "+ampm;

            const finalMsg="🕒 **এখন সময়:** "+timeInfo.emoji+" *"+timeInfo.label+"* "+timeStrBn+"\n"+sep+"\n\n"+"🗓️ **বার:** "+daysBn[dayOfWeek]+"\n"+"📆 **বাংলা তারিখ:** "+engToBn(bDay)+" "+bnMonths[bMonth]+" "+engToBn(bsYear)+" বঙ্গাব্দ\n"+"📅 **ইংরেজি তারিখ:** "+engToBn(currentDay)+" "+monthNamesEng[currentMonth]+" "+engToBn(currentYear)+"\n"+"🕌 **হিজরি তারিখ:** "+engToBn(hDate.day)+" "+arMonths[hDate.month]+" "+engToBn(hDate.year)+" হিজরি\n\n"+"🕋 **তাহাজ্জুদ:** "+prayer.t+" AM | 🕌 **ফজর:** "+prayer.f+" AM\n"+"☀️ **জোহর:** "+prayer.d+" PM | ⛅ **আসর:** "+prayer.a+" PM\n"+"🌅 **মাগরিব:** "+prayer.m+" PM | 🌙 **এশা:** "+prayer.i+" PM\n"+"⛪ **জুম্মা:** "+prayer.j+" PM\n\n"+sep+"\n"+"📅 **ইংরেজি ১২ মাস:**\n"+monthsList+"\n"+sep+"\n"+"*Credit By MOHAMMAD-BADOL*";

            const buffer=canvas.toBuffer("image/png");
            await telegram.sendPhoto(chatId, {source: buffer}, {
                caption: finalMsg,
                parse_mode: "Markdown",
                reply_markup: { inline_keyboard: [[{text:"👤 Contact Developer", url:"https://t.me/B4D9L_007"}]] }
            });

        }catch(err){
            console.error(err);
            await api.sendMessage(chatId, "❌ Error: "+err.message);
        }
    }
};