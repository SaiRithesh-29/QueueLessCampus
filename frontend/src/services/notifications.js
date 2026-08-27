// Simple notification utility for near-turn alerts.
// Uses browser Notification API when permission is granted,
// otherwise falls back to an in-app banner.

export const notifyApproaching = (peopleAhead) => {
  const title = 'Your turn is approaching!';
  const body = `Only ${peopleAhead} ${peopleAhead === 1 ? 'person is' : 'people are'} ahead of you. Please get ready.`;
  sendNotification(title, body);
  return { title, body, type: 'approaching' };
};

export const notifyYourTurn = (counterName) => {
  const title = "It's your turn!";
  const body = `Please proceed to the ${counterName} counter now.`;
  sendNotification(title, body);
  return { title, body, type: 'serving' };
};

const sendNotification = (title, body) => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
    } catch {
      // Some environments don't allow constructor; ignore
    }
  }
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'default') {
    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  }
  return Notification.permission;
};
