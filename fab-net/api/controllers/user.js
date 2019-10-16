// Import mongoose to use package
const mongoose = require('mongoose');

// require user model
const User = require("../models/user");

// import the bcrypt paackage
const bcrypt = require('bcrypt');

// package for signed tokens
const jwt = require('jsonwebtoken');

// api to interact with the fabric network
const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');

// fabric-api error handling
const ferr = require('../controllers/fabric-api-errors');

// packages required for wallet path & yaml to json conversion
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const gatewayPath = path.join(process.cwd(), '/gateway');

// Loads the yaml connection profile and converts to json
const ccpPath = yaml.safeLoad(fs.readFileSync(gatewayPath + '/networkConnection.yaml', 'utf8'));

// register user function
async function registerUser(username, admin, retrieve = false){
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(username);
        if (userExists) {
            console.log('An identity for the user ' + username + ' already exists in the wallet');
            if (retrieve === false){
                return 1
            } 
        } else {
            if (retrieve === true){
                return 2;
            }   
        }

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists(admin);
        if (!adminExists) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return 2;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: admin, discovery: { enabled: true, asLocalhost: true } });

        // Get the CA client object from the gateway for interacting with the CA.
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({ affiliation: 'org2.department1', enrollmentID: username, role: 'client' }, adminIdentity);
        const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret });
        const userIdentity = X509WalletMixin.createIdentity('Org2MSP', enrollment.certificate, enrollment.key.toBytes());
        await wallet.import(username, userIdentity);
        console.log('Successfully registered and enrolled admin user "' + username + '" and imported it into the wallet');
        return 3;

    } catch (error) {
        console.error(`Failed to register user "${username}": ${error}`);
        return error.toString();
    }
}

exports.register_user = (req, res, next) => {
    // Only one user per e-mail
    User.find({email: req.body.email})
    .exec()
    .then(user => {
        console.log(user);
        if (user.toString() != "") {
            // error code 409 means conflict
            res.status(409).json({
                message: "User exists"
            });
        } else if(Object.keys(req.body).length != "3"){
            console.log(Object.keys(req.body).length);
            res.status(500).json({
                message: `Requires 'email', 'password', 'role' `
            });
        } else {
            bcrypt.hash(req.body.password, 10, async (err, hash) => {
                if(err) {
                    return res.status(500).json({
                        error: err
                    });
                } else {
                    const user = new User({
                        _id: new mongoose.Types.ObjectId(),
                        email: req.body.email,
                        // solding rounds to add random strings to the 
                        // password ',10'
                        password: hash,
                        role: req.body.role
                    });
                    var status = await registerUser(req.body.email, req.userData.email);
                    // Error code 4 is used to denote error from fabric-ca
                    var error_fab_api = 4;
                    if (isNaN(status)){
                        error_fab_api = status;
                        status = 4;
                    }
                    if (status === 1){
                        res.status(409).json({
                            message: 'An identity for the user ' + req.body.email + ' already exists in the wallet'
                        });
                    } else if (status === 2){
                        res.status(404).json({
                            message: 'Contact Admin'
                        });  
                    } else if (status === 4){
                        res.status(500).json({
                            message: `Failed to register user "${req.body.email}"`,
                            error: error_fab_api
                        });    
                    } else {
                        user
                        .save()
                        .then(result => {
                            console.log(result);
                            res.status(201).json({
                                message: "user created"
                            });
                        })
                        .catch(err => {
                            res.status(500).json({
                                error: err
                            });
                        }); 
                    }   
                }
            });
        }
    })
    .catch(err => {
        res.status(500).json({
            error: err
        })
    });
}

exports.retrieve_user = (req, res, next) => {
    const retrieve = true;
    // Only one user per e-mail
    User.find({email: req.body.email})
    .exec()
    .then(user => {
        console.log(user);
        if (user.toString() != "") {
            // error code 409 means conflict
            res.status(409).json({
                message: "User exists"
            });
        } else if(Object.keys(req.body).length != "3"){
            console.log(Object.keys(req.body).length);
            res.status(500).json({
                message: `Requires 'email', 'password', 'role' `
            });
        } else {
            bcrypt.hash(req.body.password, 10, async (err, hash) => {
                if(err) {
                    return res.status(500).json({
                        error: err
                    });
                } else {
                    const user = new User({
                        _id: new mongoose.Types.ObjectId(),
                        email: req.body.email,
                        // solding rounds to add random strings to the 
                        // password ',10'
                        password: hash,
                        role: req.body.role
                    });
                    // retrieve is set as 'true' to retrieve the user
                    var status = await registerUser(req.body.email, req.userData.email, retrieve);
                    // Error code 4 is used to denote error from fabric-ca
                    var error_fab_api = 4;
                    if (isNaN(status)){
                        error_fab_api = await ferr.fabric_api_error(status);
                        if (error_fab_api === true){
                            status = 3;
                        } else {
                            status = 4;
                        }
                    }
                    if (status === 1){
                        res.status(409).json({
                            message: 'An identity for the user ' + req.body.email + ' already exists in the wallet'
                        });
                    } else if (status === 2){
                        res.status(404).json({
                            message: 'Contact Admin'
                        });  
                    } else if (status === 4){
                        res.status(500).json({
                            message: `Failed to register user "${req.body.email}"`,
                            error: error_fab_api
                        });    
                    } else {
                        user
                        .save()
                        .then(result => {
                            console.log(result);
                            res.status(201).json({
                                message: "user created"
                            });
                        })
                        .catch(err => {
                            res.status(500).json({
                                error: err
                            });
                        }); 
                    }   
                }
            });
        }
    })
    .catch(err => {
        res.status(500).json({
            error: err
        })
    });   
}

exports.log_user_in = (req, res, next) => {
    if(Object.keys(req.body).length != "2"){
        console.log(Object.keys(req.body).length);
        res.status(500).json({
            message: `Requires 'email', 'password' `
        });
    }
    else {
        User.find({email: req.body.email})
        .exec()
        .then(user => {
            if(user.toString() === ""){
                res.status(401).json({
                    message: 'Auth failed'
                });
            }else {
                bcrypt.compare(req.body.password, user[0].password, (err, result) => {
                    if(err){
                        res.status(401).json({
                            message: 'Auth failed'
                        }); 
                    }else if(result) {
                        const token = jwt.sign(
                            {
                                email: user[0].email,
                                userdId: user[0]._id
                            }, 
                            process.env.JWT_KEY,
                            {
                                expiresIn: "1h"
                            }
                        );
                        res.status(200).json({
                            message: 'Auth successful',
                            token: token
                        });
                    }else{
                        res.status(401).json({
                            message: 'Auth failed'
                        });   
                    }
                });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
    }    
}

// Deletes user credentials from mongoDB
exports.remove_user_access = async (req, res, next) => {
    if(Object.keys(req.body).length != "1"){
        console.log(Object.keys(req.body).length);
        res.status(500).json({
            message: `Requires 'email' `
        });
    } else {
        const email = req.body.email;
        // used here to find whether user is admin or not || 'true' keeps function in retrieve mode
        var status = await registerUser(req.body.email, req.userData.email, true);
        status = await ferr.fabric_api_error(status);
        // returns true if user is admin
        if (email === process.env.ADMIN_EMAIL){
            status = false;
        }
        if (status === true)
        {
            User.deleteOne({email: email})
            .exec()
            .then(result => {
                res.status(200).json({
                    message: "User deleted"
                });
            })
            .catch(err => {
                res.status(500).json({
                    error: err
                });
            });
        } else {
            res.status(500).json({
                message: 'Not an admin || Wallet doesn\'t exist || Don\'t delete yourself'
            });
        }
    }    
}