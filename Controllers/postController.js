const Post = require('../models/Post');
const User = require('../models/User');
const Group = require('../models/Group'); // Add this import
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/posts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Get all posts for feed (updated to include group posts)
exports.getFeed = async (req, res) => {
  try {
    // Get user's groups to show group posts they have access to
    const userGroups = await Group.find({ members: req.user._id });
    const groupIds = userGroups.map(g => g._id);
    
    const posts = await Post.find({
      $or: [
        { group: null }, // Public posts
        { group: { $in: groupIds } } // Group posts user has access to
      ]
    })
      .populate('user', 'username avatar isVerified')
      .populate('group', 'name') // Add group info
      .populate('comments.user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.render('feed', { posts, user: req.user });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).render('error', { message: 'Failed to load feed' });
  }
};

// Get posts as JSON for AJAX requests (updated to include group posts)
exports.getPostsJson = async (req, res) => {
  try {
    // Get user's groups to show group posts they have access to
    const userGroups = await Group.find({ members: req.user._id });
    const groupIds = userGroups.map(g => g._id);
    
    const posts = await Post.find({
      $or: [
        { group: null }, // Public posts
        { group: { $in: groupIds } } // Group posts user has access to
      ]
    })
      .populate('user', 'username avatar isVerified')
      .populate('group', 'name') // Add group info
      .populate('comments.user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

// Create new post (UPDATED with group support)
exports.createPost = async (req, res) => {
  console.log('\n=== 📝 CREATE POST DEBUG ===');
  console.log('User:', req.user?.username, req.user?._id);
  console.log('Body:', req.body);
  console.log('File:', req.file ? `${req.file.filename} (${req.file.size} bytes)` : 'No file');
  
  try {
    const { caption, location, group } = req.body; // Add 'group' here
    
    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({ error: 'Image is required' });
    }

    if (!req.user || !req.user._id) {
      console.log('❌ No user in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // If posting to a group, verify user is a member
    if (group) {
      console.log('🔍 Checking group membership for group:', group);
      const groupDoc = await Group.findById(group);
      if (!groupDoc) {
        console.log('❌ Group not found:', group);
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Check if user is a member of the group
      if (!groupDoc.members.includes(req.user._id)) {
        console.log('❌ User not authorized to post to group:', group);
        return res.status(403).json({ error: 'Not authorized to post to this group' });
      }
      
      console.log('✅ User is member of group:', groupDoc.name);
    }

    console.log('✅ Creating post for user:', req.user.username);

    // Extract hashtags from caption
    const hashtags = caption ? caption.match(/#\w+/g) || [] : [];
    
    const newPost = new Post({
      user: req.user._id,
      caption: caption || '',
      image: '/uploads/posts/' + req.file.filename,
      location: location || '',
      group: group || null, // Add this line - null means public feed
      hashtags: hashtags.map(tag => tag.toLowerCase())
    });

    console.log('📝 Saving post...');
    const savedPost = await newPost.save();
    console.log('✅ Post saved successfully with ID:', savedPost._id);
    
    // Populate group info in response
    await savedPost.populate('group', 'name');
    
    // Log where the post was created
    if (savedPost.group) {
      console.log('📍 Post created in group:', savedPost.group.name);
    } else {
      console.log('📍 Post created on public feed');
    }
    
    res.json({ 
      success: true, 
      post: savedPost,
      // Add redirect info for frontend
      redirectTo: savedPost.group ? `/group/${savedPost.group._id}` : '/home'
    });
    
  } catch (error) {
    console.error('❌ Error creating post:', error.message);
    console.error('Full error:', error);
    
    res.status(500).json({ 
      error: 'Failed to create post', 
      details: error.message 
    });
  }
};

// Get comments for a specific post
exports.getPostComments = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId)
      .populate('comments.user', 'username avatar')
      .select('comments');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ 
      success: true, 
      comments: post.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// Like/Unlike post
exports.toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if post is in a group and user has access
    if (post.group) {
      const group = await Group.findById(post.group);
      if (!group || !group.members.includes(userId)) {
        return res.status(403).json({ error: 'Not authorized to interact with this post' });
      }
    }

    const likeIndex = post.likes.indexOf(userId);
    let liked = false;

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(userId);
      liked = true;
    }

    await post.save();
    
    res.json({ 
      success: true, 
      liked: liked,
      likesCount: post.likes.length 
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if post is in a group and user has access
    if (post.group) {
      const group = await Group.findById(post.group);
      if (!group || !group.members.includes(req.user._id)) {
        return res.status(403).json({ error: 'Not authorized to comment on this post' });
      }
    }

    const comment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Populate the user info for the response
    await post.populate('comments.user', 'username avatar');
    
    const newComment = post.comments[post.comments.length - 1];
    
    res.json({ 
      success: true, 
      comment: newComment,
      commentsCount: post.comments.length 
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    // Delete image file
    const imagePath = path.join(__dirname, '../public', post.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Post.findByIdAndDelete(postId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

// Get single post
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username avatar isVerified')
      .populate('group', 'name') // Add group info
      .populate('comments.user', 'username avatar');

    if (!post) {
      return res.status(404).render('error', { message: 'Post not found' });
    }

    // Check if post is in a group and user has access
    if (post.group) {
      const group = await Group.findById(post.group);
      if (!group || !group.members.includes(req.user._id)) {
        return res.status(403).render('error', { message: 'Not authorized to view this post' });
      }
    }

    res.render('post', { post, user: req.user });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).render('error', { message: 'Failed to load post' });
  }
};

// Get user's posts
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    
    // Get user's groups to filter posts appropriately
    const userGroups = await Group.find({ members: req.user._id });
    const groupIds = userGroups.map(g => g._id);
    
    const posts = await Post.find({ 
      user: userId,
      $or: [
        { group: null }, // Public posts
        { group: { $in: groupIds } } // Group posts user has access to
      ]
    })
      .populate('user', 'username avatar isVerified')
      .populate('group', 'name')
      .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

// Export upload middleware
exports.uploadImage = upload.single('image');