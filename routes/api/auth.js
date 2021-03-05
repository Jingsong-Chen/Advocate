const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
// bring in the middleware
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const {check, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');

// @route GET api/auth
// @desc Test route
// @access Public
router.get('/', auth, async (req, res) => {
    try {
        // select user info without showing password
        const summary = await User.findById(req.user.id).select('-password');
        res.json(summary);
    } catch(err) {
        res.status(500).send('Server Error: auth api');
    }
});

// @route POST api/auth
// @desc Authenticate user and get token for login
// @access Public
router.post(
    '/', 
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            // console.log(req.body);
            const {email, password} = req.body;
            try {
                // see if email already exists
                let user = await User.findOne({email: email});
                if (!user) {
                    return res
                    .status(400)
                    .json({errors: [{msg: 'email does not exit'}]});
                }
                // encrypt password
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res
                    .status(400)
                    .json({errors: [{msg: 'wrong password'}]});
                }
                // return json web token
                // user info is stored in jwt, signed with a 
                // secret key, and sent to the user
                const payload = {
                    user: {
                        id: user.id
                    }
                }
                jwt.sign(
                    payload, 
                    config.get('jwtSecret'),
                    {expiresIn: 36000}, // TODO change time
                    (err, token) => {
                        if(err) throw err;
                        return res.json({message: 'user authenticated!', token: token});
                    });
            } catch (err) {
                console.error(err.message);
                res.status(500).send('Server error: user creation');
            }
        } else {
            // status() set the status
            return res.status(400).json({errors: errors.array()});
        }  
    }
);

module.exports = router;