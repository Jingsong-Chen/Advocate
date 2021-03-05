const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {check, validationResult} = require('express-validator');

const Post = require('../../models/Post');
const User = require('../../models/User');
const Profile = require('../../models/Profile');


// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
    '/', 
    [
        auth, 
        [
            check('text', 'Text is required').not().isEmpty()
        ]
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        try{
            const user = await User.findById(req.user.id).select('-password');
            const newPost = new Post ({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            });
            // save returns the added element
            const post = await newPost.save();
            res.json(post);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);


// @route   GET api/posts
// @desc    Get all post
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({date: -1});
        res.json(posts);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET api/posts/:id
// @desc    Get post by post ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const posts = await Post.findById(req.params.id);
        if (posts) {
            res.json(posts);
        } else {
            res.status(404).json({msg: 'Post not found'});
        }
    } catch(err) {
        console.error(err.message);
        // if the object id is not well formatted
        if (err.kind === 'ObjectId') {
            return res.status(404).json({msg: 'Post not found'});
        }
        res.status(500).send('Server Error');
    }
});


// @route   DELETE api/posts/:id
// @desc    Delete post by post ID
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({msg: 'Post not found'});
        }
        // check if deleter is owner
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({msg: 'User not authorized'});
        } 
        await post.remove();
        res.json({msg: 'Post removed'});
    } catch(err) {
        console.error(err.message);
        // if the object id is not well formatted
        if (err.kind === 'ObjectId') {
            return res.status(404).json({msg: 'Post not found'});
        }
        res.status(500).send('Server Error');
    }
});


// @route   PUT api/posts/like/:id
// @desc    Like post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        // each user can only like each post once
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({msg: 'Post already liked'});
        } 
        post.likes.push({user: req.user.id});
        await post.save();
        res.json(post.likes);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT api/posts/unlike/:id
// @desc    Unike post
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({msg: 'Post is not liked'});
        } 
        // get the user index in like array
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        if (removeIndex > -1) {
            post.likes.splice(removeIndex, 1);
            await post.save();
            res.json(post.likes);
        } else {
            return res.status(400).json({msg: 'Post is not liked'});
        }        
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post(
    '/comment/:id', 
    [
        auth, 
        [
            check('text', 'Text is required').not().isEmpty()
        ]
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        try{
            const user = await User.findById(req.user.id).select('-password');
            const post = await Post.findById(req.params.id);
            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            };
            post.comments.unshift(newComment);
            // save returns the added element
            await post.save();
            res.json(post.comments);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);


// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete comment
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);
        
        if (!comment) {
            return res.status(404).json({msg: 'Comment does not exist'});
        }

        // check if deleter is owner
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({msg: 'User not authorized'});
        }

        // get the comment index in commnet array
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
        if (removeIndex > -1) {
            post.comments.splice(removeIndex, 1);
            await post.save();
            res.json(post.comments);
        } else {
            return res.status(400).json({msg: 'Comment does not exist'});
        }    
    } catch(err) {
        console.error(err.message);
        // if the object id is not well formatted
        if (err.kind === 'ObjectId') {
            return res.status(404).json({msg: 'Post not found'});
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;