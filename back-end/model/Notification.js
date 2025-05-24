const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    seen: {
        type: Boolean,
        default: false, 
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    TypeNotif: {
        type: String,
        enum: ['FINANCE', 'REGULAR'],
        default: 'REGULAR',
    },
    isAlert: {
        type: Boolean,
        default: false,
    },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;