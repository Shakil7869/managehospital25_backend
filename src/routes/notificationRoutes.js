/**
 * Notification Routes
 * All notification-related API endpoints
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

// Middleware: All routes require authentication
router.use(authenticate);

/**
 * Public routes (authenticated users)
 */

// Register device token
router.post('/register-token', notificationController.registerDeviceToken);

// Get all notifications
router.get('/', notificationController.getNotifications);

// Get unread notifications count
router.get('/unread/count', notificationController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Record notification click
router.post('/:id/click', notificationController.recordNotificationClick);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Delete all notifications
router.delete('/', notificationController.deleteAllNotifications);

// Get notification preferences
router.get('/preferences', notificationController.getPreferences);

// Update notification preferences
router.put('/preferences', notificationController.updatePreferences);

/**
 * Admin routes
 */

// Send notification to specific user
router.post('/send', authorize('admin'), notificationController.sendNotification);

// Broadcast notification to topic
router.post('/broadcast', authorize('admin'), notificationController.broadcastNotification);

module.exports = router;
