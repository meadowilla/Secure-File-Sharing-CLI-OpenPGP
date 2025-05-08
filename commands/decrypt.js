const fs = require('fs-extra');
const path = require('path');
const openpgp = require('openpgp');

async function verifyThenDecrypt(options) {
    const { signedMessageFile, sender, recipient } = options;
    const publicKey = await getSenderPublicKey(sender);
    const privateKey = await getRecipientPrivateKey(recipient);

    // Read the signedMessage
    const signedMessage = (await fs.readFile(signedMessageFile)).toString("utf8");

    // Verify the message
    const verified = await verifyMessage(signedMessage, publicKey);

    // Parse the signedMessage to extract components
    const signedContent = verified.data;
    const {encryptedSessionKey, encryptedFile} = JSON.parse(signedContent);
    // console.log("Encrypted session key: ", encryptedSessionKey);
    // console.log("Encrypted file: ", encryptedFile);

    // Decrypt the session key
    const sessionKey = await decryptSessionKey(encryptedSessionKey, privateKey);
    // console.log("Session key: ", sessionKey);

    // Decrypt the file using the session key
    await decryptFile(encryptedFile, sessionKey);
    console.log("Successfully decrypted the file.");
}

async function verifyMessage(signedMessage, publicKey) {
    const verified = await openpgp.verify({
        message: await openpgp.readMessage({ armoredMessage: signedMessage }),
        verificationKeys: [publicKey]
    });

    // console.log("verified: ", verified);

    // Check if the signature is valid
    const valid = await verified.signatures[0].verified;
    if (valid) {
        console.log("Signature is valid.");
        return verified;
    } else {
        console.error("Signature is invalid.");
        return;
    }
}

async function decryptFile(encryptedFile, sessionKey){
    const decryptedMessage = await openpgp.decrypt({
        message: await openpgp.readMessage({ armoredMessage: encryptedFile }),
        decryptionKeys: [sessionKey],
    });
    console.log("decryptedMessage: ", decryptedMessage);

    const decryptedData = decryptedMessage.data;
    // Save the decrypted data to a file or return it
    const outputFile = 'decrypted_file.txt'; // Change this to your desired output file name
    await fs.writeFile(outputFile, decryptedData);
    console.log(`Decrypted file saved as ${outputFile}`);

}

async function decryptSessionKey(encryptedSessionKey, privateKey){
    const sessionKey = await openpgp.decryptSessionKeys({
        decryptionKeys: [privateKey],
        message: await openpgp.readMessage({ armoredMessage: encryptedSessionKey }),
    });

    // console.log(`Encrypted session key: ${encryptedSessionKey}`);
    console.log("Successfully decrypt session key.");
    return sessionKey;
}

async function getSenderPublicKey(sender){
    const senderKeyDir = path.join(__dirname, '../keys', sender);
    const publicKeyPath = path.join(senderKeyDir, 'public.asc');
    if (!fs.existsSync(publicKeyPath)) {
        console.error(`Public key for ${recipient} not found.`);
        return;
    }
    const publicKeyArmored = await fs.readFile(publicKeyPath, 'utf8');
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
    // console.log("Public key: ", publicKey);
    console.log(`Successfully read public key of ${sender}.`);
    return publicKey;
}

async function getRecipientPrivateKey(recipient){
    const recipientKeyDir = path.join(__dirname, '../keys', recipient);
    const privateKeyPath = path.join(recipientKeyDir, 'private.asc');
    if (!fs.existsSync(privateKeyPath)) {
        console.error(`Private key for ${recipient} not found.`);
        return;
    }
    const privateKeyArmored = await fs.readFile(privateKeyPath, 'utf8');
    const encryptedPrivateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
    const privateKey = await openpgp.decryptKey({
        privateKey: encryptedPrivateKey,
        passphrase: 'your-secure-passphrase' // ← required if the key is encrypted
    });
    // console.log("Private key: ", privateKey);
    console.log(`Successfully read private key of ${recipient}.`);
    return privateKey;
}


module.exports = verifyThenDecrypt;