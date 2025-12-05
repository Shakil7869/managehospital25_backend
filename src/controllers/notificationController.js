/**
 * Notification Controller
 * Handles notification management endpoints
 */

const Notification = require('../models/Notification');
const FCMService = require('../services/fcmService');
const User = require('../models/User');

/**
 * Register device token for push notifications
 * @route POST /api/notifications/register-token
 */
exports.registerDeviceToken = async (req, res) => {
  try {
    const { token, platform } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!token || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Token and platform are required',
      });
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Platform must be ios, android, or web',
      });
    }

    // Find user document
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Initialize deviceTokens array if not exists
    if (!user.deviceTokens) {
      user.deviceTokens = [];
    }

    // Check if token already exists
    const existingToken = user.deviceTokens.find((dt) => dt.token === token);

    if (existingToken) {
      // Update existing token
      existingToken.isActive = true;
      existingToken.platform = platform;
      existingToken.registeredAt = new Date();
    } else {
      // Add new token
      user.deviceTokens.push({
        token,
        platform,
        isActive: true,
        registeredAt: new Date(),
      });
    }

    await user.save();

    // Subscribe to default topics
    const topics = ['all_users', `platform_${platform}`, `user_${userId}`];
    for (const topic of topics) {
      try {
        await FCMService.subscribeToTopic(topic, [token]);
      } catch (error) {
        console.error(`Failed to subscribe to topic ${topic}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Device token registered successfully',
      data: {
        token,
        platform,
      },
    });
  } catch (error) {
    console.error('Error registering device token:', error);
    return res.status(500).json({
      success: false,
      message: 'Error registering device token',
      error: error.message,
    });
  }
};

/**
 * Get all notifications for user
 * @route GET /api/notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, type, limit = 20, skip = 0 } = req.query;

    // Build query
    const query = { userId, deletedAt: null };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    // Get total count
    const total = await Notification.countDocuments(query);

    // Get paginated results
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
};

/**
 * Get unread notifications count
 * @route GET /api/notifications/unread/count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Notification.countDocuments({
      userId,
      status: { $ne: 'read' },
      deletedAt: null,
    });

    return res.status(200).json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message,
    });
  }
};

/**
 * Mark notification as read
 * @route PUT /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: id,
      userId,
      deletedAt: null,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.markAsRead();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 * @route PUT /api/notifications/mark-all-read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      {
        userId,
        status: { $ne: 'read' },
        deletedAt: null,
      },
      {
        status: 'read',
        readAt: new Date(),
      }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message,
    });
  }
};

/**
 * Delete notification
 * @route DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: id,
      userId,
      deletedAt: null,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.softDelete();

    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message,
    });
  }
};

/**
 * Delete all notifications
 * @route DELETE /api/notifications
 */
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { userId, deletedAt: null },
      { deletedAt: new Date() }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications deleted',
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting all notifications',
      error: error.message,
    });
  }
};

/**
 * Record notification click
 * @route POST /api/notifications/:id/click
 */
exports.recordNotificationClick = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: id,
      userId,
      deletedAt: null,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.recordClick();

    return res.status(200).json({
      success: true,
      message: 'Click recorded',
      data: notification,
    });
  } catch (error) {
    console.error('Error recording notification click:', error);
    return res.status(500).json({
      success: false,
      message: 'Error recording notification click',
      error: error.message,
    });
  }
};

/**
 * Send notification to user (Admin only)
 * @route POST /api/notifications/send
 */
exports.sendNotification = async (req, res) => {
  try {
    const { userId, title, body, type, data, imageUrl, priority = 'normal', scheduledFor } = req.body;

    // Validate input
    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'userId, title, and body are required',
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User or device tokens not found',
      });
    }

    // Create notification record
    const notification = new Notification({
      userId,
      title,
      body,
      type: type || 'general',
      data,
      imageUrl,
      priority,
      isScheduled: !!scheduledFor,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      deviceTokens: user.deviceTokens.filter((dt) => dt.isActive),
    });

    await notification.save();

    // Send immediately if not scheduled
    if (!scheduledFor) {
      const payload = FCMService.buildPayload(title, body, data || {}, imageUrl);
      const activeTokens = user.deviceTokens.filter((dt) => dt.isActive).map((dt) => dt.token);

      if (activeTokens.length > 0) {
        try {
          await FCMService.sendToMultipleDevices(activeTokens, payload);
          notification.status = 'sent';
          notification.sentAt = new Date();
          await notification.save();
        } catch (error) {
          console.error('Error sending notification:', error);
          notification.status = 'failed';
          notification.failureReason = error.message;
          await notification.save();
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Notification created' + (scheduledFor ? ' and scheduled' : ' and sent'),
      data: notification,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending notification',
      error: error.message,
    });
  }
};

/**
 * Send broadcast notification to topic
 * @route POST /api/notifications/broadcast
 */
exports.broadcastNotification = async (req, res) => {
  try {
    const { topic, title, body, type, data, imageUrl, priority = 'normal' } = req.body;

    // Validate input
    if (!topic || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'topic, title, and body are required',
      });
    }

    const payload = FCMService.buildPayload(title, body, data || {}, imageUrl);

    try {
      const messageId = await FCMService.sendToTopic(topic, payload);

      return res.status(200).json({
        success: true,
        message: 'Broadcast notification sent',
        data: {
          messageId,
          topic,
        },
      });
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Error broadcasting notification',
        error: error.message,
      });
    }
  } catch (error) {
    console.error('Error in broadcast endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Error in broadcast endpoint',
      error: error.message,
    });
  }
};

/**
 * Get notification preferences
 * @route GET /api/notifications/preferences
 */
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId, 'notificationPreferences');

    return res.status(200).json({
      success: true,
      data: user?.notificationPreferences || {},
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching notification preferences',
      error: error.message,
    });
  }
};

/**
 * Update notification preferences
 * @route PUT /api/notifications/preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const preferences = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences: preferences },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      data: user.notificationPreferences,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating notification preferences',
      error: error.message,
    });
  }
};
