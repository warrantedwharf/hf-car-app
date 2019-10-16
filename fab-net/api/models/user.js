// Provides a schema for user data to be stored

//require mongoose to interact with mongoDB
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    // mongoose uses this to provide unique id's
    _id: mongoose.Schema.Types.ObjectId,
    email: { 
        type: String, 
        required: true,  
        match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ 
    },
    password: { type: String, required: true },
    role: { type: String, required: true }
});

module.exports = mongoose.model('User',
userSchema);