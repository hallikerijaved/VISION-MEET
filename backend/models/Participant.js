const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  gdSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GDSession', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  transcript: { type: String, required: true },
  speakingDuration: { type: Number, default: 0 },
  participationCount: { type: Number, default: 0 },
  evaluation: {
    semanticSimilarity: { type: Number, default: 0 },
    sentimentScore: { type: Number, default: 0 },
    keywordScore: { type: Number, default: 0 },
    grammarScore: { type: Number, default: 0 },
    finalScore: { type: Number, default: 0 },
    topicRelevance: { type: Number, default: 0 },
    feedback: [String],
    engagementScore: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Participant', participantSchema);
