const express = require('express');
const { query } = require('../db/db');
const { queries } = require('../queries/queries');
const router = express.Router();

// Get all threads for a course
router.get('/threads/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await query(queries.discussion.getThreads(courseId));
    res.send(result.rows);
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

// Get posts for a thread
router.get('/posts/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const result = await query(queries.discussion.getPosts(threadId));
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create new thread
router.post('/threads', async (req, res) => {
  try {
    const { courseId, userId, title, content } = req.body;
    
    // Create thread
    const threadResult = await query(queries.discussion.createThread(courseId, userId, title));
    const threadId = threadResult.rows[0].thread_id;
    
    // Create initial post
    const postResult = await query(queries.discussion.createInitialPost(threadId, userId, content));
    
    res.json({
      thread: threadResult.rows[0],
      post: postResult.rows[0]
    });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

// Reply to thread/post
router.post('/posts', async (req, res) => {
  try {
    const { threadId, userId, content, parentPostId } = req.body;
    const result = await query(queries.discussion.replyToPost(threadId, userId, content, parentPostId));
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update thread status
router.put('/threads/:threadId/status', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { status } = req.body;
    await query(queries.discussion.updateThreadStatus(threadId, status));
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating thread status:', error);
    res.status(500).json({ error: 'Failed to update thread status' });
  }
});

// Delete post
router.delete('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    await query(queries.discussion.deletePost(postId, userId));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Edit post
router.put('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, content } = req.body;
    const result = await query(queries.discussion.editPost(postId, userId, content));
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error editing post:', error);
    res.status(500).json({ error: 'Failed to edit post' });
  }
});

module.exports = router;
