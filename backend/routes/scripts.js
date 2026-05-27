const express = require('express');
const router = express.Router();
const Script = require('../models/Script');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get all user scripts
router.get('/', auth, async (req, res) => {
  try {
    const scripts = await Script.find({ authorId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('-sourceCode'); // Exclude source code for list view
    
    res.json({
      success: true,
      count: scripts.length,
      scripts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single script by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const script = await Script.findOne({
      _id: req.params.id,
      $or: [
        { authorId: req.user._id },
        { isPublic: true }
      ]
    }).populate('authorId', 'username avatar');
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Increment view count
    script.stats.views += 1;
    await script.save();
    
    res.json({ success: true, script });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new script
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, sourceCode, version, tags, category, metadata, isPublic } = req.body;
    
    // Validate required fields
    if (!name || !description || !sourceCode) {
      return res.status(400).json({ error: 'Name, description, and source code are required' });
    }
    
    const script = new Script({
      name,
      description,
      sourceCode,
      version: version || '1.0.0',
      authorId: req.user._id,
      authorName: req.user.username,
      tags: tags || [],
      category: category || 'other',
      metadata: metadata || {},
      isPublic: isPublic || false
    });
    
    await script.save();
    
    // Add script to user's scripts array
    req.user.scripts.push(script._id);
    await req.user.save();
    
    res.status(201).json({
      success: true,
      message: 'Script created successfully',
      script
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update script
router.put('/:id', auth, async (req, res) => {
  try {
    const script = await Script.findOne({
      _id: req.params.id,
      authorId: req.user._id
    });
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found or unauthorized' });
    }
    
    const { name, description, sourceCode, version, tags, category, metadata, isPublic, changelog } = req.body;
    
    // Save current version to history if source code changed
    if (sourceCode && sourceCode !== script.sourceCode) {
      await script.saveVersion(changelog);
    }
    
    // Update fields
    if (name) script.name = name;
    if (description) script.description = description;
    if (sourceCode) script.sourceCode = sourceCode;
    if (version) script.version = version;
    if (tags) script.tags = tags;
    if (category) script.category = category;
    if (metadata) script.metadata = { ...script.metadata, ...metadata };
    if (typeof isPublic !== 'undefined') script.isPublic = isPublic;
    
    await script.save();
    
    res.json({
      success: true,
      message: 'Script updated successfully',
      script
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete script
router.delete('/:id', auth, async (req, res) => {
  try {
    const script = await Script.findOneAndDelete({
      _id: req.params.id,
      authorId: req.user._id
    });
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found or unauthorized' });
    }
    
    // Remove from user's scripts array
    req.user.scripts = req.user.scripts.filter(
      id => id.toString() !== req.params.id
    );
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Script deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get script version history
router.get('/:id/versions', auth, async (req, res) => {
  try {
    const script = await Script.findOne({
      _id: req.params.id,
      $or: [
        { authorId: req.user._id },
        { isPublic: true }
      ]
    }).select('versionHistory name');
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    res.json({
      success: true,
      versions: script.versionHistory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add review to script
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const script = await Script.findOne({
      _id: req.params.id,
      isPublic: true
    });
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Check if user already reviewed
    const existingReview = script.reviews.find(
      r => r.userId.toString() === req.user._id.toString()
    );
    
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this script' });
    }
    
    await script.addReview(req.user._id, rating, comment);
    
    res.json({
      success: true,
      message: 'Review added successfully',
      rating: script.rating
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
