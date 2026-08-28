const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  username: String,
  pfpUrl: String,
  location: String,
  exp: { type: Number, default: 0 },
  money: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  lastDailyClaim: { type: String, default: '' },
  banned: { type: Boolean, default: false },
  dmApproved: { type: Boolean, default: false },
  warnings: { type: Object, default: {} },
  messageCount: { type: Object, default: {} },
  createdAt: { type: Number, default: Date.now }
}, { strict: false });

const threadSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  type: String,
  totalUsers: { type: Number, default: 0 },
  customPrefix: { type: String, default: '' },
  approved: { type: Boolean, default: false },
  antiOut: { type: Boolean, default: false },
  approvalMode: { type: Boolean, default: false },
  autoApprove: { type: Boolean, default: false },
  lockedName: { type: Boolean, default: false },
  lockedPhoto: { type: Boolean, default: false },
  lockedDescription: { type: Boolean, default: false },
  savedName: { type: String, default: '' },
  savedPhoto: { type: String, default: '' },
  savedDescription: { type: String, default: '' },
  totalMessages: { type: Number, default: 0 },
  userMessages: { type: Object, default: {} },
  isPrivate: { type: Boolean, default: false },
  isGroup: { type: Boolean, default: false },
  isSupergroup: { type: Boolean, default: false },
  isChannel: { type: Boolean, default: false },
  description: { type: String, default: '' },
  username: { type: String, default: '' },
  inviteLink: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  pinnedMessageId: { type: Number, default: null },
  permissions: { type: Object, default: {} },
  lastActivity: { type: Number, default: Date.now },
  createdAt: { type: Number, default: Date.now }
}, { strict: false });

const approvalSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  chatId: String,
  chatName: String,
  userId: String,
  userName: String,
  addedBy: String,
  addedByName: String,
  createdAt: { type: Number, default: Date.now }
}, { strict: false });

const banSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  reason: String,
  bannedBy: String,
  bannedAt: { type: Number, default: Date.now }
}, { strict: false });

// ✅ NEW - FOR 100% MONGODB MODE
const settingsSchema = new mongoose.Schema({ key: { type: String, unique: true }, data: Object }, { strict: false });
const lockedCmdSchema = new mongoose.Schema({ name: { type: String, unique: true } }, { strict: false });
const groupCmdSchema = new mongoose.Schema({ groupId: String, mode: String, enabled: [String] }, { strict: false });
const approvedGroupSchema = new mongoose.Schema({ groupId: { type: String, unique: true } }, { strict: false });
const paidCmdSchema = new mongoose.Schema({ name: { type: String, unique: true } }, { strict: false });

class MongoDatabase {
  constructor() {
    this.User = null; this.Thread = null; this.Approval = null; this.Ban = null;
    this.Settings = null; this.LockedCmd = null; this.GroupCmd = null; this.ApprovedGroup = null; this.PaidCmd = null;
    this.connected = false;
  }

  async connect(uri) {
    try {
      await mongoose.connect(uri, { dbName: 'BADOL_TG_BOT' });
      this.User = mongoose.model('User', userSchema);
      this.Thread = mongoose.model('Thread', threadSchema);
      this.Approval = mongoose.model('Approval', approvalSchema);
      this.Ban = mongoose.model('Ban', banSchema);
      this.Settings = mongoose.model('Settings', settingsSchema);
      this.LockedCmd = mongoose.model('LockedCmd', lockedCmdSchema);
      this.GroupCmd = mongoose.model('GroupCmd', groupCmdSchema);
      this.ApprovedGroup = mongoose.model('ApprovedGroup', approvedGroupSchema);
      this.PaidCmd = mongoose.model('PaidCmd', paidCmdSchema);
      this.connected = true;
      console.log("✅ MongoDB Connected - 100% FAST MODE");
      return true;
    } catch (error) { console.error('MongoDB connection error:', error); return false; }
  }

  // ✅ SUPER FAST - FIRE & FORGET - NO AWAIT BLOCK
  ensureUserAndThread(ctx) {
    try {
      const from = ctx.from; const chat = ctx.chat; if (!from) return Promise.resolve();
      const uid = String(from.id);
      this.User.updateOne({ id: uid }, { $set: { firstName: from.first_name||'', lastName: from.last_name||'', username: from.username||'' }, $setOnInsert: { id: uid, createdAt: Date.now() } }, { upsert: true }).exec().catch(()=>{});
      if (chat) {
        const tid = String(chat.id);
        const isGroup = chat.type==='group'||chat.type==='supergroup';
        this.Thread.updateOne({ id: tid }, { $set: { name: chat.title||from.first_name||'', type: chat.type, isGroup, lastActivity: Date.now() }, $setOnInsert: { id: tid, createdAt: Date.now() } }, { upsert: true }).exec().catch(()=>{});
      }
    } catch {}
    return Promise.resolve();
  }

  async getUser(userId) {
    userId = String(userId);
    let user = await this.User.findOne({ id: userId }).lean();
    if (!user) {
      await this.User.updateOne({ id: userId }, { $setOnInsert: { id: userId, createdAt: Date.now() } }, { upsert: true });
      user = await this.User.findOne({ id: userId }).lean();
    }
    return user;
  }

  async updateUser(userId, data) {
    userId = String(userId);
    const user = await this.User.findOneAndUpdate({ id: userId }, { $set: data }, { new: true, upsert: true }).lean();
    return user;
  }

  // ✅ For referralSystem compatibility
  async setUser(userId, data) { return await this.updateUser(userId, data); }

  async getThread(threadId) {
    threadId = String(threadId);
    let thread = await this.Thread.findOne({ id: threadId }).lean();
    if (!thread) {
      await this.Thread.updateOne({ id: threadId }, { $setOnInsert: { id: threadId, createdAt: Date.now() } }, { upsert: true });
      thread = await this.Thread.findOne({ id: threadId }).lean();
    }
    return thread;
  }

  async updateThread(threadId, data) {
    threadId = String(threadId);
    const thread = await this.Thread.findOneAndUpdate({ id: threadId }, { $set: data }, { new: true, upsert: true }).lean();
    return thread;
  }

  async incrementUserExp(userId, amount = 5) {
    userId = String(userId);
    const user = await this.getUser(userId);
    let exp = (user.exp||0) + amount;
    let level = user.level||1;
    const expNeeded = level * 100;
    if (exp >= expNeeded) { level++; exp = exp - expNeeded; }
    return await this.updateUser(userId, { exp, level });
  }

  async getAllUsers() { return await this.User.find({}).lean(); }
  async getAllThreads() { return await this.Thread.find({}).lean(); }

  async addApproval(type, data) {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.Approval.create({ id, type,...data, createdAt: Date.now() });
    return id;
  }
  async getApproval(id) { const a = await this.Approval.findOne({ id }).lean(); return a||null; }
  async removeApproval(id) { await this.Approval.deleteOne({ id }); }
  async getAllApprovals(type = null) { const q = type? { type } : {}; return await this.Approval.find(q).lean(); }

  async banUser(userId, reason = '', bannedBy = '') {
    userId = String(userId);
    await this.Ban.findOneAndUpdate({ userId }, { userId, reason, bannedBy, bannedAt: Date.now() }, { upsert: true });
    await this.updateUser(userId, { banned: true });
  }
  async unbanUser(userId) { userId = String(userId); await this.Ban.deleteOne({ userId }); await this.updateUser(userId, { banned: false }); }
  async isUserBanned(userId) { const b = await this.Ban.findOne({ userId: String(userId) }).lean(); return!!b; }
  async getBanInfo(userId) { const b = await this.Ban.findOne({ userId: String(userId) }).lean(); return { reason: b?.reason||'Violation' }; }
  async getAllBans() { return await this.Ban.find({}).lean(); }

  async addWarning(userId, chatId, reason = '', warnedBy = '') {
    userId = String(userId); chatId = String(chatId);
    const user = await this.getUser(userId);
    const warnings = user.warnings||{};
    if (!warnings[chatId]) warnings[chatId]=[];
    warnings[chatId].push({ reason, warnedBy, warnedAt: Date.now() });
    await this.updateUser(userId, { warnings });
    return warnings[chatId].length;
  }
  async getWarnings(userId, chatId) { const u = await this.getUser(String(userId)); return u.warnings?.[String(chatId)]||[]; }
  async clearWarnings(userId, chatId) { const u = await this.getUser(String(userId)); const w = u.warnings||{}; delete w[String(chatId)]; await this.updateUser(String(userId), { warnings: w }); }

  // ✅ FAST - ATOMIC
  async incrementMessageCount(userId, threadId) {
    userId = String(userId); threadId = String(threadId);
    this.User.updateOne({ id: userId }, { $inc: { [`messageCount.${threadId}`]: 1 } }).exec().catch(()=>{});
    this.Thread.updateOne({ id: threadId }, { $inc: { totalMessages: 1, [`userMessages.${userId}`]: 1 } }).exec().catch(()=>{});
    return { userCount: 1, threadTotal: 1 };
  }
  async getUserMessageCount(userId, threadId) { const u = await this.getUser(String(userId)); return u.messageCount?.[String(threadId)]||0; }
  async getThreadMessageStats(threadId) { const t = await this.getThread(String(threadId)); return { totalMessages: t.totalMessages||0, userMessages: t.userMessages||{} }; }

  // ✅ NEW METHODS FOR 100% MONGODB
  async getSettings() { const s = await this.Settings.findOne({ key: 'global' }).lean(); return s?.data||{}; }
  async updateSettings(data) { return await this.Settings.updateOne({ key: 'global' }, { $set: { data } }, { upsert: true }); }
  async getLockedCommands() { const l = await this.LockedCmd.find({}).lean(); return l.map(x=>x.name); }
  async getAllGroupCommands() { const all = await this.GroupCmd.find({}).lean(); const obj={}; all.forEach(x=>obj[x.groupId]=x); return obj; }
  async getApprovedGroups() { const l = await this.ApprovedGroup.find({}).lean(); return l.map(x=>x.groupId); }
  async getPaidCommands() { const l = await this.PaidCmd.find({}).lean(); return l.map(x=>x.name); }
  async isPaid(name) { const p = await this.PaidCmd.findOne({ name: String(name).toLowerCase() }).lean(); return!!p; }
}

module.exports = MongoDatabase;