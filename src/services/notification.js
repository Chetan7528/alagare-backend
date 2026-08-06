const OneSignal = require('@onesignal/node-onesignal');
const Device = require('@models/Device');
const Notification = require('@models/Notification2');
const User = require('@models/User');

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;

const ONESIGNAL_REST_API_KEY = {
  getToken() {
    return process.env.ONESIGNAL_REST_API_KEY;
  },
};
const configuration = OneSignal.createConfiguration({
  restApiKey: process.env.ONESIGNAL_REST_API_KEY,
  authMethods: {
    rest_api_key: { tokenProvider: ONESIGNAL_REST_API_KEY },
  },
});
const client = new OneSignal.DefaultApi(configuration);

async function sendPush(content, player_ids, title) {
  if (!player_ids || player_ids.length === 0) return null;
  try {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_subscription_ids = player_ids;
    notification.contents = {
      en: content,
    };
    if (title) {
      notification.headings = {
        en: title,
      };
    }
    return await client.createNotification(notification);
  } catch (err) {
    console.error('error in send notification', content, err);
  }
}

async function findPlayerIds(userIds) {
  const devices = await Device.find({ user: { $in: userIds }, player_id: { $ne: null } });
  return devices.map((d) => d.player_id).filter(Boolean);
}

/** True unless the user has turned push, or this specific category, off. */
const canNotify = (user, category) => {
  const prefs = user?.notificationPrefs || {};
  if (prefs.pushEnabled === false) return false;
  if (category && prefs[category] === false) return false;
  return true;
};

/** Low-level: always sends, records the notification, no preference check. */
const notify = async (userId, title, content) => {
  await Notification.create({ for: [userId], title, description: content });
  const player_ids = await findPlayerIds([userId]);
  return sendPush(content, player_ids, title);
};

/** Preference-aware: use this from controllers instead of `notify` directly. */
const notifyUser = async (user, category, title, content) => {
  if (!canNotify(user, category)) return null;
  return notify(user._id, title, content);
};

/** Broadcast to every user who hasn't opted out of `category` (e.g. promos, new routes). */
const notifyAllUsers = async (category, title, content, job = null) => {
  const filter = { 'notificationPrefs.pushEnabled': { $ne: false } };
  if (category) filter[`notificationPrefs.${category}`] = { $ne: false };
  const users = await User.find(filter).select('_id');
  const userIds = users.map((u) => u._id);
  if (userIds.length === 0) return null;

  const notObj = { for: userIds, title, description: content };
  if (job) notObj.invited_for = job;
  await Notification.create(notObj);

  const player_ids = await findPlayerIds(userIds);
  return sendPush(content, player_ids, title);
};

module.exports = {
  notify,
  notifyUser,
  notifyAllUsers,
  canNotify,
};
