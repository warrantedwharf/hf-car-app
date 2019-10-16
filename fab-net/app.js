// This file spins up the express server & also helps in
// handling requests easier for us

// imports express package
const express = require('express');

// use all express utility methods
const app = express();

// Use morgan to log incoming requests
const morgan = require('morgan');

// Use body-parser to parse incoming requests
// url encoded & JSON data
const bodyParser = require('body-parser');

// require mongoose for mongodb
const mongoose = require('mongoose');

// require query route
const queryRoutes = require('./api/routes/query');

// require users route
const userRoutes = require('./api/routes/users');

// require invoke route
const invokeRoute = require('./api/routes/invoke');

// Connect to the database
mongoose.connect('mongodb+srv://node-rest:'+process.env.MONGO_ATLAS_PW+'@cluster0-vvmct.mongodb.net/test?retryWrites=true&w=majority', 
{
    useNewUrlParser: true,
    useUnifiedTopology: true
}
).catch(err => console.log(err));

// To log using morgan
app.use(morgan('dev'));

// use body-parser to read url encoded data
// extended: true to parse rich data
app.use(bodyParser.urlencoded({extended: false}));

// use body-parser to read JSON data
app.use(bodyParser.json());

// Filter url with '/query'
app.use('/query', queryRoutes);

// Filter url with '/users'
app.use('/users', userRoutes);

// Filter url with '/invoke'
app.use('/invoke', invokeRoute);

// Handle every request that reach here
app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

// handles the error thrown anywhere here
app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        error: {
            message: error.message
        }
    });
});

// make app available to other files
module.exports = app;