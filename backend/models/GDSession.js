const mongoose = require('mongoose');

const gdSessionSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  description: { type: String },
  idealAnswer: { type: String },
  moderator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  roomId: { type: String, required: true, unique: true },
  maxParticipants: { type: Number, default: 10 }
}, { timestamps: true });

module.exports = mongoose.model('GDSession', gdSessionSchema);
