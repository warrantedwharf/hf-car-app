// import http from node js to provide some functionality
// to make a server
const http = require('http');

// import child_process to spawn blockEventlistener
const spawn = require('child_process').spawn;

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

// path to blockEventlistener program
const pgm_bEl = process.cwd() + '/child_process/offchaindb/blockEventListener';

// spawn the blockEventListener program
const proc = spawn(process.argv0, [pgm_bEl]);

// log events to catch output/errors
proc.stdout.on('data', function(data){
    console.log(data.toString());
});

// log errors from blockEventListener
proc.stderr.on('error', function(error){
    console.log(error.toString());
});

// This starts the server and listens at the port
server.listen(port);