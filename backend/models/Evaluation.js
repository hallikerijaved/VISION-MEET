const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  gdId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  gdTitle: { type: String, required: true },
  scores: {
    topicRelevance: { type: Number, required: true },
    semanticSimilarity: { type: Number, required: true },
    keywordMatching: { type: Number, required: true },
    sentimentScore: { type: Number, required: true },
    grammarQuality: { type: Number, required: true },
    communicationQuality: { type: Number, required: true },
    participationAnalysis: { type: Number, required: true },
    confidenceAnalysis: { type: Number, required: true },
    finalScore: { type: Number, required: true }
  },
  feedback: { type: String, required: true },
  strengths: [String],
  weaknesses: [String],
  improvements: [String],
  matchedKeywords: [String],
  messageCount: { type: Number, default: 0 },
  speakingTime: { type: Number, default: 0 },
  engagementScore: { type: Number, default: 0 },
  transcript: [String],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
