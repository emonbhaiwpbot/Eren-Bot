// BADOL/referralSystem.js - V9 FINAL - PAID_PATH FIXED
const path = require('path');
const fs = require('fs');

class ReferralSystem {
  constructor() {
    this.CMDS_PATH = path.join(__dirname, "..", "BADOL-CMDS", "cmds");
    this.EVENT_PATH = path.join(__dirname, "..", "BADOL-CMDS", "events");
    
    // ✅ FIXED: PAID_PATH Added for paid.js compatibility
    this.PAID_PATH = path.join(__dirname, "..", "BADOL-CACHE", "paid.json");
    this.PAID_PATH_ALT = path.join(__dirname, "paid.json");
    
    this.NEW_USER_CREDIT = 2;
    this.REFERRER_BONUS = 5;
    this.REFEREE_BONUS = 2;
    this._paidCache = { list: [], time: 0 };
  }

  async getPaidList() {
    try {
      if (Date.now() - this._paidCache.time < 60000) {
        return this._paidCache.list;
      }
      // ✅ 1st: MongoDB (Main)
      if (global.db?.getPaidCommands) {
        const list = await global.db.getPaidCommands();
        if(list && list.length>=0){
          this._paidCache = { list: list || [], time: Date.now() };
          return list;
        }
      }
      // ✅ 2nd: Fallback File (if Mongo empty)
      if (fs.existsSync(this.PAID_PATH)) {
        const fileList = JSON.parse(fs.readFileSync(this.PAID_PATH, 'utf8'));
        this._paidCache = { list: fileList || [], time: Date.now() };
        return fileList;
      }
      return [];
    } catch { return this._paidCache.list || []; }
  }

  getRealName(input) {
    if (!input) return input;
    const name = String(input).toLowerCase();
    try {
      if (global.badol?.commands) {
        const direct = global.badol.commands.get(name);
        if (direct) return direct.config.name;
        for (const [_, c] of global.badol.commands) {
          if (c.config.aliases && c.config.aliases.map(a=>a.toLowerCase()).includes(name)) {
            return c.config.name;
          }
        }
      }
      const scanPath = fs.existsSync(this.CMDS_PATH) ? this.CMDS_PATH : path.join(__dirname, "BADOL-CMDS");
      if (!fs.existsSync(scanPath)) return input;
      const files = fs.readdirSync(scanPath);
      for (const file of files) {
        if (!file.endsWith('.js')) continue;
        try {
          const cmd = require(path.join(scanPath, file));
          if (!cmd.config) continue;
          const main = cmd.config.name.toLowerCase();
          const aliases = (cmd.config.aliases || []).map(a => a.toLowerCase());
          if (main === name || aliases.includes(name)) return cmd.config.name;
        } catch {}
      }
    } catch {}
    return input;
  }

  async isPaid(inputName) {
    if (!inputName) return false;
    const paidList = (await this.getPaidList()).map(v => String(v).toLowerCase());
    const realName = this.getRealName(inputName).toLowerCase();
    const input = String(inputName).toLowerCase();
    return paidList.includes(realName) || paidList.includes(input);
  }

  isPaidSync(inputName) {
    if (!inputName) return false;
    const list = this._paidCache.list.map(v => String(v).toLowerCase());
    if (list.length === 0) return false;
    const input = String(inputName).toLowerCase();
    const real = this.getRealName(inputName).toLowerCase();
    return list.includes(input) || list.includes(real);
  }

  async getUser(userId) {
    userId = String(userId);
    let user = await global.db.getUser(userId);
    if (!user || !user.id) {
      const newUser = {
        id: userId,
        credits: this.NEW_USER_CREDIT,
        referrals: 0,
        referredBy: null,
        joinedAt: Date.now()
      };
      await global.db.updateUser(userId, newUser);
      return newUser;
    }
    if (user.credits === undefined || user.credits === null) user.credits = this.NEW_USER_CREDIT;
    if (user.referrals === undefined) user.referrals = 0;
    return user;
  }

  async useCredit(userId, cmdName) {
    const realName = this.getRealName(cmdName);
    const isPaid = await this.isPaid(realName);
    if (!isPaid) return { ok: true, bypass: true };
    
    const user = await this.getUser(userId);
    if ((user.credits || 0) > 0) {
      const newCredits = (user.credits || 0) - 1;
      await global.db.updateUser(String(userId), { credits: newCredits });
      return { ok: true, left: newCredits };
    }
    return { ok: false, left: 0 };
  }

  async handleReferral(newId, refId) {
    newId = String(newId);
    refId = String(refId);

    if (newId === refId) {
      return { ok: false, success: false, reason: "self" };
    }

    const newUser = await this.getUser(newId);
    if (newUser.referredBy || newUser.referrer) {
      return { ok: false, success: false, reason: "already referred" };
    }

    const refUser = await this.getUser(refId);

    const refNewCredits = (refUser.credits || 0) + this.REFERRER_BONUS;
    const refNewReferrals = (refUser.referrals || 0) + 1;
    const newUserCredits = (newUser.credits || 0) + this.REFEREE_BONUS;

    await global.db.updateUser(refId, { credits: refNewCredits, referrals: refNewReferrals });
    await global.db.updateUser(newId, { credits: newUserCredits, referredBy: refId, referrer: refId });

    console.log(`✅ REFER REAL SUCCESS: ${newId} -> ${refId} | Ref: ${refNewCredits} | New: ${newUserCredits}`);

    return {
      ok: true,
      success: true,
      refUser: { ...refUser, credits: refNewCredits },
      newUser: { ...newUser, credits: newUserCredits }
    };
  }
}

module.exports = new ReferralSystem();