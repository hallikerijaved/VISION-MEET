const express = require('express');
const GD = require('../models/GD');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all active GDs
router.get('/', auth, async (req, res) => {
  try {
    const gds = await GD.find({ isActive: true })
      .populate('moderator', 'name')
      .populate('participants', 'name');
    res.json(gds);
  } catch (error) {
    console.error('Get GDs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get GDs conducted by the logged-in user, including ended sessions
router.get('/mine/conducted', auth, async (req, res) => {
  try {
    const gds = await GD.find({ moderator: req.user._id })
      .populate('moderator', 'name')
      .populate('participants', 'name')
      .sort({ createdAt: -1 });

    res.json(gds);
  } catch (error) {
    console.error('Get conducted GDs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new GD
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, maxParticipants } = req.body;
    const roomId = Date.now().toString();
    
    const gd = new GD({
      title,
      description,
      moderator: req.user._id,
      roomId,
      participants: [req.user._id],
      maxParticipants: maxParticipants || 10
    });
    
    await gd.save();
    await gd.populate('moderator', 'name');
    
    req.app.get('io').emit('gd-updated');
    res.status(201).json(gd);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Join GD
router.post('/:id/join', auth, async (req, res) => {
  try {
    const gd = await GD.findById(req.params.id);
    if (!gd || !gd.isActive) {
      return res.status(404).json({ message: 'GD not found or inactive' });
    }

    if (gd.participants.length >= gd.maxParticipants) {
      return res.status(400).json({ message: 'GD is full' });
    }

    // Use toString() comparison for ObjectId
    const alreadyJoined = gd.participants.some(p => p.toString() === req.user._id.toString());
    if (!alreadyJoined) {
      gd.participants.push(req.user._id);
      await gd.save();
    }

    await gd.populate('moderator', 'name');
    await gd.populate('participants', 'name');
    req.app.get('io').emit('gd-updated');
    res.json(gd);
  } catch (error) {
    console.error('Join GD error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Leave GD
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const gd = await GD.findById(req.params.id);
    if (!gd) {
      return res.status(404).json({ message: 'GD not found' });
    }
    
    gd.participants = gd.participants.filter(p => p.toString() !== req.user._id.toString());
    
    // Auto-close if no participants left
    if (gd.participants.length === 0) {
      gd.isActive = false;
    }
    
    await gd.save();
    req.app.get('io').emit('gd-updated');
    res.json({ message: 'Left GD successfully', participantCount: gd.participants.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// End GD (moderator only)
router.patch('/:id/end', auth, async (req, res) => {
  try {
    const gd = await GD.findById(req.params.id);
    if (!gd) {
      return res.status(404).json({ message: 'GD not found' });
    }
    
    if (gd.moderator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only moderator can end GD' });
    }
    
    gd.isActive = false;
    await gd.save();
    
    req.app.get('io').to(gd.roomId).emit('session-closed');
    req.app.get('io').emit('gd-updated');
    res.json({ message: 'GD ended successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
