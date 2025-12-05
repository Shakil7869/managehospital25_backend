const admin = require('firebase-admin');

// FCM Service class
class FCMService {
  /**
   * Initialize Firebase Admin SDK
   * @param {Object} serviceAccount - Firebase service account credentials
   */
  static initializeFirebase(serviceAccount) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }

  /**
   * Send notification to single device
   * @param {string} token - Device FCM token
   * @param {Object} payload - Notification payload
   * @returns {Promise<string>} - Message ID
   */
  static async sendToDevice(token, payload) {
    try {
      const message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: {
          ...payload.data,
          timestamp: new Date().toISOString(),
        },
        android: {
          priority: 'high',
          notification: {
            title: payload.title,
            body: payload.body,
            icon: 'ic_notification',
            color: '#8B5CF6',
            sound: 'default',
          },
        },
        webpush: {
          headers: {
            TTL: '3600',
          },
          notification: {
            title: payload.title,
            body: payload.body,
            icon: '/icons/app-icon.png',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const messageId = await admin.messaging().send(message);
      console.log(`Successfully sent message to ${token}:`, messageId);
      return messageId;
    } catch (error) {
      console.error(`Error sending message to ${token}:`, error);
      throw error;
    }
  }

  /**
   * Send notification to multiple devices
   * @param {Array<string>} tokens - Array of device FCM tokens
   * @param {Object} payload - Notification payload
   * @returns {Promise<Object>} - Result statistics
   */
  static async sendToMultipleDevices(tokens, payload) {
    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          ...payload.data,
          timestamp: new Date().toISOString(),
        },
        android: {
          priority: 'high',
          notification: {
            title: payload.title,
            body: payload.body,
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              sound: 'default',
            },
          },
        },
      };

      const response = await admin.messaging().sendMulticast({
        ...message,
        tokens,
      });

      console.log(`Message sent: ${response.successCount} successful, ${response.failureCount} failed`);
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      console.error('Error sending multicast message:', error);
      throw error;
    }
  }

  /**
   * Send notification to topic subscribers
   * @param {string} topic - Firebase topic name
   * @param {Object} payload - Notification payload
   * @returns {Promise<string>} - Message ID
   */
  static async sendToTopic(topic, payload) {
    try {
      const message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: {
          ...payload.data,
          timestamp: new Date().toISOString(),
        },
        android: {
          priority: 'high',
          notification: {
            title: payload.title,
            body: payload.body,
            sound: 'default',
          },
        },
      };

      const messageId = await admin.messaging().send(message);
      console.log(`Successfully sent message to topic ${topic}:`, messageId);
      return messageId;
    } catch (error) {
      console.error(`Error sending message to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe device to topic
   * @param {string} topic - Topic name
   * @param {Array<string>} tokens - Device tokens
   * @returns {Promise<Object>} - Result
   */
  static async subscribeToTopic(topic, tokens) {
    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      console.log(`Subscribed ${response.successCount} devices to topic ${topic}`);
      return {
        topic,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe device from topic
   * @param {string} topic - Topic name
   * @param {Array<string>} tokens - Device tokens
   * @returns {Promise<Object>} - Result
   */
  static async unsubscribeFromTopic(topic, tokens) {
    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      console.log(`Unsubscribed ${response.successCount} devices from topic ${topic}`);
      return {
        topic,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Send scheduled notification (delayed)
   * @param {string} token - Device token
   * @param {Object} payload - Notification payload
   * @param {number} delayMs - Delay in milliseconds
   * @returns {Promise<string>} - Timer ID
   */
  static scheduleNotification(token, payload, delayMs) {
    return new Promise((resolve) => {
      const timerId = setTimeout(async () => {
        try {
          const messageId = await this.sendToDevice(token, payload);
          console.log(`Scheduled notification sent: ${messageId}`);
          resolve(messageId);
        } catch (error) {
          console.error('Error sending scheduled notification:', error);
        }
      }, delayMs);

      resolve(timerId);
    });
  }

  /**
   * Build rich notification payload
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Custom data object
   * @param {string} imageUrl - Image URL (optional)
   * @returns {Object} - Complete payload
   */
  static buildPayload(title, body, data = {}, imageUrl = null) {
    return {
      title: title || 'Healthcare System',
      body: body || 'You have a new notification',
      data: {
        ...data,
        click_action: data.click_action || 'FLUTTER_NOTIFICATION_CLICK',
      },
      imageUrl,
    };
  }

  /**
   * Get FCM instance for direct access
   * @returns {Object} - Firebase messaging instance
   */
  static getMessaging() {
    return admin.messaging();
  }
}

module.exports = FCMService;
