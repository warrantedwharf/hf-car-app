// Handle all invoke related routes 

// Import the express package
const express = require('express');

// Helps to handle different routes
const router = express.Router();

// imports authorization logic
const checkAuth = require('../middleware/check-auth');

// import package for invoke controller
const invoke = require('../controllers/invoke');

// handle post requests at '/invoke'
router.post('/', checkAuth, invoke.invokecc);

// To make the routes available to other processes
module.exports = router;

