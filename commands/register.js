const openpgp = require('openpgp');
const fs = require('fs-extra');
const path = require('path');

async function register(options) {
    const { username } = options;
    const { privateKey, publicKey} = await openpgp.generateKey({
        userIDs: { name: username }, // User ID
        type: "rsa",
        format: "armored", // Output format
        passphrase: "your-secure-passphrase", // Passphrase for the private key
    });

    // Save to keys directory
    const userKeyDir = path.join(__dirname, '../keys', username);
    await fs.ensureDir(userKeyDir);
    fs.writeFile(path.join(userKeyDir, 'public.asc'), publicKey);
    fs.writeFile(path.join(userKeyDir, 'private.asc'), privateKey);

    console.log(`Keys generated for ${username}`);

    return { privateKey, publicKey };
}

module.exports = register;