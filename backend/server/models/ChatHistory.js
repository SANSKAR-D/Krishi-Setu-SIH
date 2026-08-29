const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  messages: [{
    role: { type: String, enum: ['user', 'ai'], required: true },
    text: { type: String },
    image: { type: String }, // image url
    hasAudio: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
