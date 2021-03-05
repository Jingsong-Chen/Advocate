const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI'); // check default.json

const connectDB = async () => {
    // need try-catch syntax in case the connection fails
    try{
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        });
        console.log('MongoDB Connected...');
    } catch(err) {
        console.error(err.message);
        // Exit process with failure
        process.exit(1);
    }
}

module.exports = connectDB;