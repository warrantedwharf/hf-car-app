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

// This function is used to query the chaincode
async function queryCC(username, ccqfn = 'queryAllCars', id = '0') {
    try {

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
        await gateway.connect(ccpPath, { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcarcc');

        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        const result = await contract.evaluateTransaction(ccqfn, id);
        //console.log(`Transaction has been evaluated, result is: ${result}`);
        return result;

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
    }
}

// Controller to query all data
exports.query_get_all = async (req, res, next) => {
    const result = await queryCC(req.userData.email);
    console.log(req.userData.email);
    // This is used to pretty format JSON response
    const obj = JSON.parse(result);
    res.status(200).json({
        message: obj
    });
}

exports.query_get_one = async (req, res, next) => {
    const id = req.params.carId;
    const result = await queryCC(req.userData.email, 'queryCar', id);
    // This is used to pretty format JSON response
    if(result.toString() != ""){
        try{
        const obj = JSON.parse(result);
        res.status(200).json({
        message: obj
        });
        }
        catch(err){
            res.status(500).json({
                error: err
            });
        }
    }
    else{
        res.status(404).json({
            error: "Invalid Id"
        });   
    }
}