const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // place holder for profile pictures
    avatar: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now()
    }
});

// module.exports represent User.js in other files
// chaining equal signs to assign different vars with the same val
// MongoDB pluralizes the schema name; so instead of user it's users
module.exports = mongoose.model('user', userSchema);