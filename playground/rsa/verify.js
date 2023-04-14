const NodeRSA = require('node-rsa');

// Generate Key
const key = new NodeRSA(`-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEAj2BHBk9AD9L/gK1lacLP/COAeeLLGGSDBaWbnx84lzD5v5tePkNv
iAZcBiQccYm6Q7atvl7HqXnUtC8qRQzRnoB15agXsEMooNFuv8trwJqWAgIXr2IY
83ZdvBKRMe3QBEcqtFkIvwLsNbfAROHJAPffF5/BnJSDWALljEMrxzzuVBSKbyTX
MWzKGVeRyH4H6FsH+Atx3cFbmwU+bwJlqOgcJ8dUbeo4y7lRynHDhIkrgd8SyMsE
RPngTSTQ0zI/qFcHW+JnRvS3MaGGpRzsJBUVl7nTHJ73jbg/J+8Nlz1NKi2KkJPH
EYv4YyJgOhfXgUoF9hUJY7cqJ19kWgmTGQIDAQAB
-----END RSA PUBLIC KEY-----`);

// sign
const buffer = Buffer.from('hello', 'utf-8');
const signature = Buffer.from('40d846e8b932435d163105b9e35938bfc6c7a2d61b9b657bec671b62e87041edb158b110bd85d1f62dc2c54c0d55b7227bcbd8c8af74e6050634f057ef1def2f29b83909b52279c3ad5bde960177aef2b81f2cfbe45a696f79822cb26d41f3df24f0524d71b88c778793075853d4fe6d3061993cc60fa0932a965261bfb805b9a5d1c6c2aca8f23c7b617073f41b0f35097f1e24a7e092a044366f9e7c8ac9df1ef41286b893e7fc2514a2c98ddddf70e2d2f9b219f4c513ee8b8348691f209d12fc6202ad9c20e7b5ef2d875c155f0ffc1310aaba04b27457346c173a1be4708b35c32fa99f4571f0317b7db82414e89a0d0a139f561611a435475676299e44', 'hex')

// verify signature
const result = key.verify(buffer, signature, 'buffer', 'buffer');
console.log(result);
