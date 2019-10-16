// To discourage unused variables
'use strict';

// Handle all chaincode query related routes 

// Import the express package
const express = require('express');

// Helps to handle different routes
const router = express.Router();

// Query controller
const queryController = require('../controllers/query');

//import authorizaation logic
const checkAuth = require('../middleware/check-auth');

// Handles a GET request to /query route
router.get('/', checkAuth, queryController.query_get_all);

// Handles a GET request to /query route
router.get('/:carId', checkAuth, queryController.query_get_one);

// To make the routes available to other processes
module.exports = router;