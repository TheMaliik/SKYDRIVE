const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    seen: {
        type: Boolean,
        default: false, // Une notification est non lue par défaut
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
