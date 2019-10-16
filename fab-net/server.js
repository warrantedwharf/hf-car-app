// import http from node js to provide some functionality
// to make a server
const http = require('http');

// import from app.js
// Autommatically looks for js files
const app = require('./app');

// The port at which the project should run
// Either default 3000 or user set env variable
const port = process.env.PORT || 4000;

// Create the server using the http package
// The create server function takes a listener that 
// executes everytime we get a new request {also 
// responsible for returning a response}
// (app) is passed so the express app handles the
// request
const server = http.createServer(app);

// This starts the server and listens at the port
server.listen(port);