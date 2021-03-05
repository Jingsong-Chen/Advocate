// require is like 'import' in python
const express = require('express');
const connectDB = require('./config/db');
// create an instance of express server
const app = express();
// whatever port available in the environment or 3000
const PORT = process.env.PORT || 5000;

// connect to database
connectDB();

// Init Middleware
// middleware mounted without a path will be executed for every request to the app
// parses incoming requests with JSON payloads
// app.use(express.json({extended: false}));
app.use(express.json());

// define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

// each GET request is specified with a route and a handler
// (arg1, ...) => return is like python's lambda functions
app.get('/', (req, res) => res.send(`API Running`));
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
