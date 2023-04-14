const NodeRSA = require('node-rsa');

// Generate Key
const key = new NodeRSA(`-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAj2BHBk9AD9L/gK1lacLP/COAeeLLGGSDBaWbnx84lzD5v5te
PkNviAZcBiQccYm6Q7atvl7HqXnUtC8qRQzRnoB15agXsEMooNFuv8trwJqWAgIX
r2IY83ZdvBKRMe3QBEcqtFkIvwLsNbfAROHJAPffF5/BnJSDWALljEMrxzzuVBSK
byTXMWzKGVeRyH4H6FsH+Atx3cFbmwU+bwJlqOgcJ8dUbeo4y7lRynHDhIkrgd8S
yMsERPngTSTQ0zI/qFcHW+JnRvS3MaGGpRzsJBUVl7nTHJ73jbg/J+8Nlz1NKi2K
kJPHEYv4YyJgOhfXgUoF9hUJY7cqJ19kWgmTGQIDAQABAoIBAHSqkyC/PBGkT+QV
NIBq1XMGMHT95uViZHsj1w4UCah9YbxYYMepeAfnpNoaaEq7F6Yh8B8IYM+3Iy27
c1ncpHWlckn+DciP3W9+++91R6jiIU5hBYTg/gyeNIflU+Cc8reIcWdvS36ikjLj
4sAqObVf/Vjr1k/jST1EniUUQ3tLCKaaePcuHPJ3fcthrKX3doZ9ym2PNn+XYecz
QE6QR5txEowPN7MVyExaP8TaYZdRQGSE0cMruxdbCebhSKgw7PtrIOjq6LPhDzDy
gUG9kLI/lI4FlDkJYC4hOdezycZ+T13KLHYsGnw+dsC4PAqk4w/JVaqgut4jtUU6
pe8XNQECgYEA807085nVLkV6cEJOHRxVtS5oblw8ZI27deg2mQpBBEaD8/H7IpR2
R1nyNj5UV6Ba8UhBGG+9CLjMrm9yuefydPZN6ki+yxK0d1aF20OjllFKEolKJzG7
ZyE+xulCU9cKHajvTJWra9tKvyheNd+ct1Ae5G47DB9pmzKX/uFJclUCgYEAltrd
OrufmMoNnc0N8uha4SM68s3+pz2tGbQ954Qqux3Co+JgQwsVL0OuUT198BG2wSYB
kTySLU3bKHx68Z8p4HMXVzLheJI3eob+2yJ/UIZKjoz3dO4MsFb2KseiWXYeV7Gp
uUE47KVGlfC6gNM32m2iKB361i1YJDo2oxn7ybUCgYEA3toz/Cerng0fP1FL8Nfy
HNhb6LFs04EJ8c32rCg7MupPlBHQv3SR/XqCInLml7gVdCiFDxfRYfq55w/HWkX7
ymuLJArrTl9ckm3afuGuJVFhcibzl4CysJw/vrsJ+HbfGhmQzWnNMCYUiZA08k1V
YoXtNbdNOCZReUhW9apttl0CgYBxiHiVWl2r1O1YhNnppZu38xbLY+MypMVhIfix
BBRQzP4O7zF5Y57m+m338GqWwg4j4WGul8J/3CeDmePBcwNGS/gWBVIRtyGP0od+
DsF4rgjwrgES/JGKKXiNC8AQykfdwfU1WnPoDh9Ie2sxx0Uy2+39eUqt5GSAp1s1
dzm7PQKBgQDTWs2NKZuB4b6o0CEHte+SoINfHvVFDWbotJAZ//l+z1SmTlH7qb+/
jsDhmF/uizOdlopee6fdDaIzYNxEOseI2dx3UjLk6QYqtPBCu9KJ1juSeCReMSjH
BWhALtiQk07pmfH+zFEYEwBhZ0OKaUAZuabat21qFr0cuX1VN8jtBQ==
-----END RSA PRIVATE KEY-----`);

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

// sign
const buffer = Buffer.from('hello', 'utf-8');
const signature = key.sign(buffer, 'buffer', 'buffer');
console.log("signature:", signature.toString('hex'));

// verify signature
const result = key.verify(buffer, signature, 'buffer', 'buffer');
console.log(result);
