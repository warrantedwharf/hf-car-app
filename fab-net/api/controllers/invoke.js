// Import the fabric-network api
const { FileSystemWallet, Gateway } = require('fabric-network');

// Package to import wallet from path
const path = require('path');

// The 'fs' & 'yaml' packages are required to import &
// convert connection profile yaml to json
const fs = require('fs');
const yaml = require('js-yaml');

const gatewayPath = path.join(process.cwd(), '/gateway');

// Loads the yaml connection profile and converts to json
const ccpPath = yaml.safeLoad(fs.readFileSync(gatewayPath + '/networkConnection.yaml', 'utf8'));

async function invokechaincode(username, cfp) {
    try {
        console.log(cfp[1]);
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(username);
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: username, discovery: { enabled: true, asLocalhost: false } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcarcc');

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
        await contract.submitTransaction(...cfp);
        console.log('Transaction has been submitted');
        return 1;

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        return 2;
    }
}

exports.invokecc = async (req, res, next) => {
    // This check is to to show the required params
    if(Object.keys(req.body).length < "3"){
        console.log(Object.keys(req.body).length);
        res.status(500).json({
            message: `Requires 'ccfn', 'id', 'brand', 'model', 'color', 'owner' `
        });
    } else {
        // Takes necessary params for chaincode
        // cfp => Chaincode Function Params
        var cfp = `${req.body.ccfn},${req.body.id},${req.body.brand},${req.body.model},${req.body.color},${req.body.owner}`;

        // This code removes un-filled fields
        cfp = cfp.replace(/,undefined/g, '');

        // split into array
        cfp = cfp.split(',');

        console.log(cfp);
        // call chaincode through api
        const outcome = await invokechaincode(req.userData.email, cfp);
        
        // provide response according to outcome code
        if ( outcome === 1 ){
            res.status(200).json({
                message: 'Transaction has been submitted'
            });
        }  else {
            res.status(500).json({
                message: 'Failed to submit transaction'
            });  
        }  
    }    
}