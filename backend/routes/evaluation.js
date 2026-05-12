const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Evaluation = require('../models/Evaluation');
const aiAnalysis = require('../services/aiAnalysis');

// Generate and store evaluation with blockchain certificate
router.post('/generate', auth, async (req, res) => {
  try {
    const { gdId, gdTitle, messageCount, speakingTime, contributions } = req.body;

    if (!gdId || !contributions || contributions.length === 0) {
      return res.status(400).json({ message: 'GD ID and contributions required' });
    }

    const combinedText = contributions.join(' ');
    const analysis = await aiAnalysis.analyzeCommunication(combinedText, req.user.name, gdTitle, gdTitle);

    const speakingTimeRatio = speakingTime > 0 ? (speakingTime / 60) : 0;
    const engagementScore = (0.5 * contributions.length) + (0.5 * speakingTimeRatio);

    const evaluation = new Evaluation({
      gdId,
      userId: req.user.id,
      userName: req.user.name,
      gdTitle: gdTitle || 'Group Discussion',
      scores: {
        topicRelevance: analysis.topicRelevance,
        semanticSimilarity: analysis.semanticSimilarity,
        keywordMatching: analysis.keywordMatching,
        sentimentScore: analysis.sentimentScore,
        grammarQuality: analysis.grammarQuality,
        communicationQuality: analysis.communicationQuality,
        participationAnalysis: analysis.participationAnalysis,
        confidenceAnalysis: analysis.confidenceAnalysis,
        finalScore: analysis.finalScore
      },
      feedback: analysis.feedback,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      improvements: analysis.improvements,
      matchedKeywords: analysis.matchedKeywords || [],
      messageCount: messageCount || 0,
      speakingTime: speakingTime || 0,
      engagementScore: engagementScore,
      transcript: contributions
    });

    await evaluation.save();

    res.json({ success: true, evaluation });
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ message: 'Evaluation failed', error: error.message });
  }
});

// Get user's evaluations
router.get('/my-evaluations', auth, async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch evaluations' });
  }
});

// Get evaluations for a specific GD session
router.get('/session/:gdId', auth, async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ gdId: req.params.gdId }).sort({ 'scores.finalScore': -1 });
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch session evaluations' });
  }
});

// Get single evaluation
router.get('/:id', auth, async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) return res.status(404).json({ message: 'Evaluation not found' });
    if (evaluation.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });
    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch evaluation' });
  }
});

module.exports = router;
