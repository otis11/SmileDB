const crypto = require('node:crypto')

db.createCollection('users');
for (var i = 1; i <= 1000; i++) {
    db.users.insert({
        name: "User" + i,
        email: "user" + i + "@example.com",
        password: crypto.getRandomValues(new Uint32Array(1))[0]
    });
}
