// Offchaindb cleaner program

// import nano to interact with couchdb
// also include url of couchdb
const nano = require('nano')('http://192.168.0.125:5990');

nano.db.destroy('mychannel_fabcarcc').then((body) => {
    // database destroyed
  })

nano.db.destroy('mychannel_fabcarcc_history').then((body) => {
    // database destroyed
})

  nano.db.list().then((body) => {
    // body is an array
    body.forEach((db) => {
      console.log(db);
    });
  });