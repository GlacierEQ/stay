const express = require('express');
const router = express.Router();
const Script = require('../models/Script');
const User = require('../models/User');
const { optionalAuth } = require('../middleware/auth');

/**
 * Public script discovery and search endpoints
 */

// Search public scripts
router.get('/scripts/search', optionalAuth, async (req, res) => {
  try {
    const {
      q,           // Search query
      tags,        // Comma-separated tags
      category,    // Script category
      sort,        // Sort by: downloads, rating, updated, created
      page = 1,    // Page number
      limit = 20   // Results per page
    } = req.query;
    
    // Build query
    let query = { isPublic: true, isActive: true };
    
    // Text search
    if (q) {
      query.$text = { $search: q };
    }
    
    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim().toLowerCase());
      query.tags = { $in: tagArray };
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Sort options
    let sortOption = { createdAt: -1 }; // Default: newest first
    
    switch (sort) {
      case 'downloads':
        sortOption = { downloads: -1, createdAt: -1 };
        break;
      case 'rating':
        sortOption = { 'rating.average': -1, 'rating.count': -1 };
        break;
      case 'updated':
        sortOption = { updatedAt: -1 };
        break;
      case 'popular':
        sortOption = { favorites: -1, downloads: -1 };
        break;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Execute query
    const scripts = await Script.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-sourceCode -reviews') // Exclude heavy fields
      .populate('authorId', 'username avatar');
    
    // Get total count
    const total = await Script.countDocuments(query);
    
    res.json({
      success: true,
      scripts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trending scripts (most downloaded in last 30 days)
router.get('/scripts/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const scripts = await Script.find({
      isPublic: true,
      isActive: true,
      updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
      .sort({ downloads: -1, 'rating.average': -1 })
      .limit(limit)
      .select('-sourceCode -reviews')
      .populate('authorId', 'username avatar');
    
    res.json({
      success: true,
      scripts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top rated scripts
router.get('/scripts/top-rated', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const scripts = await Script.find({
      isPublic: true,
      isActive: true,
      'rating.count': { $gte: 5 } // At least 5 ratings
    })
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(limit)
      .select('-sourceCode -reviews')
      .populate('authorId', 'username avatar');
    
    res.json({
      success: true,
      scripts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get featured scripts (handpicked or high quality)
router.get('/scripts/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const scripts = await Script.find({
      isPublic: true,
      isActive: true,
      downloads: { $gte: 100 },
      'rating.average': { $gte: 4.0 }
    })
      .sort({ 'rating.average': -1, downloads: -1 })
      .limit(limit)
      .select('-sourceCode -reviews')
      .populate('authorId', 'username avatar');
    
    res.json({
      success: true,
      scripts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get script by ID (public view)
router.get('/scripts/:id', async (req, res) => {
  try {
    const script = await Script.findOne({
      _id: req.params.id,
      isPublic: true,
      isActive: true
    })
      .populate('authorId', 'username avatar bio')
      .populate('reviews.userId', 'username avatar');
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Increment view count
    script.stats.views += 1;
    await script.save();
    
    res.json({
      success: true,
      script
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download script (increment download counter)
router.post('/scripts/:id/download', async (req, res) => {
  try {
    const script = await Script.findOne({
      _id: req.params.id,
      isPublic: true,
      isActive: true
    });
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    await script.incrementDownloads();
    
    res.json({
      success: true,
      sourceCode: script.sourceCode,
      metadata: script.metadata,
      version: script.version
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all available categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Script.distinct('category', {
      isPublic: true,
      isActive: true
    });
    
    // Get count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => ({
        name: cat,
        count: await Script.countDocuments({
          category: cat,
          isPublic: true,
          isActive: true
        })
      }))
    );
    
    res.json({
      success: true,
      categories: categoriesWithCount.sort((a, b) => b.count - a.count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get popular tags
router.get('/tags', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    // Aggregate to get tag counts
    const tags = await Script.aggregate([
      { $match: { isPublic: true, isActive: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { tag: '$_id', count: 1, _id: 0 } }
    ]);
    
    res.json({
      success: true,
      tags
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get author profile
router.get('/authors/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-passwordHash -email')
      .populate({
        path: 'scripts',
        match: { isPublic: true, isActive: true },
        select: '-sourceCode'
      });
    
    if (!user) {
      return res.status(404).json({ error: 'Author not found' });
    }
    
    res.json({
      success: true,
      author: user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
