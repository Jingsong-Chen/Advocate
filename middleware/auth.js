const jwt = require('jsonwebtoken');
const config = require('config');

// for protected routes
module.exports = function(req, res, callback) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token){
        return res.status(401).json({msg: 'No token, authorization denided'});
    }

    // verify token
    try{
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        // remember that the token payload has an id in it
        req.user = decoded.user;
        return callback();
    } catch(err) {
        res.status(401).json({msg: 'Token is not valid'});
    }
}

