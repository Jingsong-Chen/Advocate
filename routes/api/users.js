const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const config = require('config');

// @route POST api/users
// @desc Register user
// @access Public
router.post(
    '/', 
    // the second argument is a list of check functions
    [
        check('name', 'Name is required').notEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({min: 6})
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            // console.log(req.body);
            const {name, email, password} = req.body;
            try {
                // see if email already exists
                let user = await User.findOne({email: email});
                if (user) {
                    return res.status(400).json({errors: [{msg: 'Email already exists.'}]});
                }
                // get users' gravatar
                const avatar = gravatar.url(email, {
                    s: '200',
                    r: 'pg',
                    d: 'mm'
                });
                // create new user
                user = new User({
                    name,
                    email,
                    avatar,
                    password
                });
                // encrypt password
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);
                // save the new user to database
                await user.save();
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
                        return res.json({message: 'user registered!', token: token});
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