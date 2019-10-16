// Handle all user related routes 

// Import the express package
const express = require('express');

// Helps to handle different routes
const router = express.Router();

// require user controller
const userController = require('../controllers/user');

// imports authorization logic
const checkAuth = require('../middleware/check-auth');

// User sign up
router.post("/registeruser", checkAuth, userController.register_user);

// retrieve user
router.post("/retrieveuser", checkAuth, userController.retrieve_user);

// delete user
router.delete('/', checkAuth, userController.remove_user_access);

// login
router.post('/login', userController.log_user_in);

module.exports = router;