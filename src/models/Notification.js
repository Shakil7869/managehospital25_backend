/**
 * Notification Model
 * Stores all notification history and user preferences
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // Recipient information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deviceTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        platform: {
          type: String,
          enum: ['ios', 'android', 'web'],
          required: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Notification content
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'appointment_reminder',
        'appointment_cancelled',
        'lab_result_ready',
        'prescription_ready',
        'doctor_message',
        'billing_reminder',
        'health_alert',
        'system_update',
        'fraud_alert',
        'high_risk_alert',
        'general',
      ],
      default: 'general',
      required: true,
    },

    // Data payload
    data: {
      referenceId: String, // ID of related record (appointment, lab test, etc.)
      referenceType: {
        type: String,
        enum: [
          'appointment',
          'lab_test',
          'report',
          'prescription',
          'billing',
          'patient',
          'doctor',
          'alert',
        ],
      },
      actionUrl: String, // Deep link or navigation path
      metadata: mongoose.Schema.Types.Mixed, // Additional custom data
    },

    // Status and delivery
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'read'],
      default: 'pending',
      index: true,
    },
    sentAt: {
      type: Date,
      index: true,
    },
    readAt: Date,
    deliveryAttempts: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: Date,
    failureReason: String,

    // Scheduling
    scheduledFor: {
      type: Date,
      index: true,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },

    // Priority
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },

    // Image and rich content
    imageUrl: String,
    actionButtons: [
      {
        id: String,
        title: String,
        action: String,
      },
    ],

    // User preferences
    respectUserPreferences: {
      type: Boolean,
      default: true,
    },
    silentNotification: {
      type: Boolean,
      default: false,
    },

    // Analytics
    clickedCount: {
      type: Number,
      default: 0,
    },
    lastClickedAt: Date,
    dismissedAt: Date,

    // Batch information
    campaignId: {
      type: String,
      index: true,
    },
    batchId: {
      type: String,
      index: true,
    },

    // Soft delete
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

// Indexes for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ 'data.referenceId': 1, 'data.referenceType': 1 });
notificationSchema.index({ scheduledFor: 1, isScheduled: 1 });
notificationSchema.index({ sentAt: 1 });

// Virtual for unread notifications
notificationSchema.virtual('isUnread').get(function () {
  return this.status !== 'read' && !this.readAt;
});

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Method to mark as sent
notificationSchema.methods.markAsSent = function () {
  this.status = 'sent';
  this.sentAt = new Date();
  this.deliveryAttempts += 1;
  this.lastAttemptAt = new Date();
  return this.save();
};

// Method to mark as failed
notificationSchema.methods.markAsFailed = function (reason) {
  this.status = 'failed';
  this.failureReason = reason;
  this.deliveryAttempts += 1;
  this.lastAttemptAt = new Date();
  return this.save();
};

// Method to track click
notificationSchema.methods.recordClick = function () {
  this.clickedCount += 1;
  this.lastClickedAt = new Date();
  return this.save();
};

// Statics for common queries
notificationSchema.statics.getUnreadNotifications = function (userId) {
  return this.find({
    userId,
    status: { $ne: 'read' },
    deletedAt: null,
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.getNotificationsForPeriod = function (userId, startDate, endDate) {
  return this.find({
    userId,
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
    deletedAt: null,
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.getPendingNotifications = function () {
  return this.find({
    status: 'pending',
    scheduledFor: { $lte: new Date() },
    deletedAt: null,
  });
};

// Soft delete support
notificationSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

notificationSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

// TTL index for automatic cleanup (30 days for read notifications)
notificationSchema.index(
  { deletedAt: 1 },
  {
    expireAfterSeconds: 2592000, // 30 days
    partialFilterExpression: { deletedAt: { $ne: null } },
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
