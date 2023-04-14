const NodeRSA = require('node-rsa');

// Generate Key
const key = new NodeRSA({b: 2048});

// Private Key
const private = key.exportKey('pkcs1-private');
console.log(private);

// Public Key
const public = key.exportKey('pkcs1-public');
console.log(public);

// modulus
const components = key.exportKey('components');
const modulus = components.n.toString('hex').replace('00', '');
console.log("modulus:", modulus);
