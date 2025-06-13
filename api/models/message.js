const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
}, { timestamps: true });

// ✅ Export the model instead of just the schema
const MessageModel = mongoose.model('Message', MessageSchema);

module.exports = MessageModel;
