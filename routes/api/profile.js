const express = require('express');
const request = require('request')
const config = require('config')
const router = express.Router();
const auth = require('../../middleware/auth');
const {check, validationResult} = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { response } = require('express');


// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        //                              this id is from the token
        //                                  populate add fields to the query from a schema
        const profile = await Profile.findOne({user:req.user.id}).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({msg:'There is no profile for this user'});
        }
        res.json(profile);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST api/profile
// @desc    Create/update profile by user id
// @access  Private
router.post(
    '/', 
    [auth, 
        [
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty()
        ]
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        const {
            company,
            website,
            location,
            status,
            skills,
            bio,
            githubusername,
            youtube,
            twitter,
            facebook,
            linkedin,
            instagram
        } = req.body;

        // build profile object; create an empty object and populate it
        const profileFields = {};
        profileFields.user = req.user.id;
        if(company) profileFields.company = company;
        if(website) profileFields.website = website;
        if(location) profileFields.location = location;
        if(bio) profileFields.bio = bio;
        if(status) profileFields.status = status;
        if(githubusername) profileFields.githubusername = githubusername;
        if(skills) {
            // originally, skills is a ',' separated string
            // break it into an array and drop spaces
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }

        // Build social object
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (instagram) profileFields.social.instagram = instagram;

        try {
            let profile = await Profile.findOne({user: req.user.id});
            // if profile exits, update profile
            if (profile) {
                profile = await Profile.findOneAndUpdate(
                    {user: req.user.id}, 
                    // $set appends new fields to existing documents
                    // Specifying an existing field name in a $set operation causes the original field to be replaced.
                    {$set: profileFields}, 
                    // this returns the updated object
                    {new: true});
            } else {
                // create new profile
                profile = new Profile(profileFields);
                await profile.save();
            }
            return res.json(profile);
        } catch(err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
        console.log(profileFields.skills);
        res.send('Good');
    }
);


// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.params.user_id})
        .populate('user', ['name', 'avatar']);
        if (!profile) return res.status(400).json({msg:'Profile not found'});
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        // this handles invalid id format (instead of not found)
        if (err.kind == 'ObjectId') {
            return res.status(400).json({msg:'Profile not found'});
        }
        res.status(500).send('Server Error');
    }
});


// @route   DELETE api/profile
// @desc    Delete profile, user & posts 
// @access  Private
router.delete('/', auth, async (req, res) => {
    try {
        // remove profile for user id
        await Profile.findOneAndRemove({user: req.user.id});
        // remove user for user id
        await User.findOneAndRemove({_id: req.user.id});
        // TODO remove posts for user id
        res.json({msg: 'User deleted'});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put(
    '/experience', 
    [
        auth, 
        [
            check('title', 'Title is required').not().isEmpty(),
            check('company', 'Company is required').not().isEmpty(),
            check('from', 'From date is required').not().isEmpty(),
        ]
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body;

        const experience = {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        };

        try {
            const profile = await Profile.findOne({user: req.user.id});
            // add the new experience to the front of the experience array
            profile.experience.unshift(experience);
            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);


// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile with id
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.user.id});
        
        // get the index to remove
        const removeIndex = profile.experience.map(item => item.id)
        .indexOf(req.params.exp_id);
        console.log(removeIndex);
        // splice(a,b,c) replaces b elements at index a with c
        if (removeIndex > -1) {
            profile.experience.splice(removeIndex, 1);
            await profile.save();
        } else {
            return res.status(400).send('Bad experience ID');
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put(
    '/education', 
    [
        auth, 
        [
            check('school', 'School is required').not().isEmpty(),
            check('degree', 'Degree is required').not().isEmpty(),
            check('fieldofstudy', 'Field of study is required').not().isEmpty(),
        ]
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body;

        const education = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        };

        try {
            const profile = await Profile.findOne({user: req.user.id});
            // add the new education to the front of the education array
            profile.education.unshift(education);
            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);


// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile with id
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.user.id});
        
        // get the index to remove
        const removeIndex = profile.education.map(item => item.id)
        .indexOf(req.params.edu_id);
        // splice(a,b,c) replaces b elements at index a with c
        if (removeIndex > -1) {
            profile.education.splice(removeIndex, 1);
            await profile.save();
        } else {
            return res.status(400).send('Bad education ID');
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET api/profile/github/:username
// @desc    Get user repos from GitHub
// @access  Public
router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: {'user-agent': 'node.js'}
        };
        request(options, (error, response, body) => {
            if (error) console.error(error);
            if (response.statusCode !== 200) {
                return res.status(404).json({msg: 'No GitHub profile found'});
            }
            res.json(JSON.parse(body));
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
module.exports = router;