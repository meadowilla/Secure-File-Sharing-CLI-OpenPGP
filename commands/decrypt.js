const fs = require('fs-extra');
const path = require('path');
const openpgp = require('openpgp');
const {confirm} = require('@inquirer/prompts');
const { exit } = require('process');

async function verifyThenDecrypt(options) {
    const { signedMessageFile, sender, recipient } = options;
    const publicKey = await getSenderPublicKey(sender);
    const privateKey = await getRecipientPrivateKey(recipient);

    // Read the signedMessage
    const signedMessage = (await fs.readFile(signedMessageFile)).toString("utf8");

    // Verify the message
    console.log(`> Verifying message...`);
    const verified = await verifyMessage(signedMessage, publicKey);

    // Parse the signedMessage to extract components
    const signedContent = verified.data;
    const {trueSender, encryptedSessionKey, encryptedFile} = JSON.parse(signedContent);

    // Check if the sender matches the true sender
    if (trueSender !== sender) {
        console.error(`> Sender mismatch! Expected: ${sender}, Found: ${trueSender}`);
        return;
    }

    // Decrypt the session key
    console.log(`> Decrypting session key...`);
    const sessionKey = await decryptSessionKey(encryptedSessionKey, privateKey);

    // Decrypt the file using the session key
    console.log(`> Decrypting file...`);
    await decryptFile(encryptedFile, sessionKey);
}

async function verifyMessage(signedMessage, publicKey) {
    try {
        const verified = await openpgp.verify({
            message: await openpgp.readMessage({ armoredMessage: signedMessage }),
            verificationKeys: [publicKey]
        });
        // Check if the signature is valid
        const valid = await verified.signatures[0].verified;
        if (valid) {
            console.log("Signature is VALID!");
            return verified;
        } else {
            console.error("Signature is INVALID!");
            exit(1);
        }
    } catch (error) {
        console.error("> Signature is INVALID!");
        exit(1);
    }
}

async function decryptFile(encryptedFile, sessionKey){
    const decryptedMessage = await openpgp.decrypt({
        message: await openpgp.readMessage({ armoredMessage: encryptedFile }),
        sessionKeys: sessionKey,
    });
    console.log(decryptedMessage);

    const decryptedData = Buffer.from(decryptedMessage.data, 'binary');
    // Save the decrypted data to a file or return it
    const outputFile = 'decrypted_file.txt'; // Change this to your desired output file name
    await fs.writeFile(outputFile, decryptedData);
    console.log(`> Decrypted file is saved as ${outputFile}`);

}

async function decryptSessionKey(encryptedSessionKey, privateKey){
    const sessionKey = await openpgp.decryptSessionKeys({
        decryptionKeys: [privateKey],
        message: await openpgp.readMessage({ armoredMessage: encryptedSessionKey }),
    });
    return sessionKey;
}

async function getSenderPublicKey(sender){
    const senderKeyDir = path.join(__dirname, '../keys', sender);
    const publicKeyPath = path.join(senderKeyDir, 'public.asc');
    if (!fs.existsSync(publicKeyPath)) {
        console.error(`Public key for ${sender} not found.`);
        return;
    }
    const publicKeyArmored = await fs.readFile(publicKeyPath, 'utf8');
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

    // Check the fingerprint of the sender's public key
    const fingerprint = publicKey.getFingerprint().toUpperCase();
    const formatted = fingerprint.match(/.{1,2}/g).join(':');
    console.log(`> ${sender}’s OpenPGP fingerprint: ${formatted}`);

    const answer = await confirm(
        {
            message: `> Confirm this is the trusted key for ${sender}?`,
            default: false
        }
    );

    if (!answer) {
        console.log('❌ Aborted. Unverified key.');
        process.exit(1);
    }

    console.log(`> Successfully read public key of ${sender}.`);
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
    return privateKey;
}


module.exports = verifyThenDecrypt;