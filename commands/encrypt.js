const fs = require('fs-extra');
const path = require('path');
const openpgp = require('openpgp');

async function encryptThenSign(options) {
    const { file, sender, recipient, output } = options;
    const publicKey = await getRecipientPublicKey(recipient);
    const sessionKey = await genSessionKey(publicKey);

    // Encrypt the file and session key
    const encryptedSessionKey = await encryptSessionKey(sessionKey, publicKey);
    const encryptedFile = await encryptFile(file, publicKey, output);
    const encryptedMessage = JSON.stringify({
        encryptedSessionKey: encryptedSessionKey,
        encryptedFile: encryptedFile,
    });
    console.log("Encrypted message: ", encryptedMessage);

    // Sign message with sender's private key
    const privateKey = await getSenderPrivateKey(sender);
    const signedMessage = await signMessage(encryptedMessage, privateKey);

    // Save the encrypted message and signature to a file
    const signedMessageFile = `${file}.enc.sig`;
    await fs.writeFile(signedMessageFile, signedMessage);
    console.log(`Signature saved as ${signedMessageFile}`);

    // console.log("Ready to be sent.");
    // console.log("Encrypted session key: ", encryptedSessionKey);
    // console.log("Encrypted file: ", encryptedFile);
    // console.log("Signature: ", signature);
    return {signedMessage};
}

async function signMessage(encryptedMessage, privateKey) {
    const signedMessage = await openpgp.sign({
        message: await openpgp.createMessage({ text: encryptedMessage }),
        signingKeys: [privateKey],
        format: 'armored',
    });
    console.log("Successfully sign message.");
    return signedMessage;
}

async function encryptFile(file, publicKey, output){
    const outputFile = `${file}.enc` || output;

    // Check if the file exists
    if (!fs.existsSync(file)) {
        console.error(`File ${file} does not exist.`);
        return;
    }

    // Encrypt the file using the recipient's public key
    const fileData = await fs.readFile(file);
    const encryptedData = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: fileData.toString() }),
        encryptionKeys: [publicKey],
        format: 'armored',
    });
    // console.log(`Encrypted data: ${encryptedData}`);

    // Save the encrypted data to the output file
    await fs.writeFile(outputFile, encryptedData);
    console.log(`Encrypted file saved as ${outputFile}`);

    return encryptedData;

}

async function encryptSessionKey(sessionKey, publicKey){
    const encryptedSessionKey = await openpgp.encryptSessionKey({
        encryptionKeys: [publicKey],
        format: 'armored',
        data: sessionKey.data,
        algorithm: 'aes256',
    });

    // console.log(`Encrypted session key: ${encryptedSessionKey}`);
    console.log("Successfully encrypt session key.");

    // Save the encrypted session key to a file
    const sessionKeyFile = path.join(__dirname, `sessionKey.enc`);
    await fs.writeFile(sessionKeyFile, encryptedSessionKey);
    console.log(`Encrypted session key saved as ${sessionKeyFile}`);

    return encryptedSessionKey;
}

async function genSessionKey(publicKey){
    const {data, algorithm} = await openpgp.generateSessionKey({
        encryptionKeys: [publicKey]
    })

    // console.log(`Session key: ${data}`);
    // console.log(`Algorithm: ${algorithm}`);
    console.log("Successfully generate session key.");
    return {data};
}

async function getRecipientPublicKey(recipient){
    const recipientKeyDir = path.join(__dirname, '../keys', recipient);
    const publicKeyPath = path.join(recipientKeyDir, 'public.asc');
    if (!fs.existsSync(publicKeyPath)) {
        console.error(`Public key for ${recipient} not found.`);
        return;
    }
    const publicKeyArmored = await fs.readFile(publicKeyPath, 'utf8');
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
    // console.log("Public key: ", publicKey);
    console.log(`Successfully read public key of ${recipient}.`);
    return publicKey;
}

async function getSenderPrivateKey(sender){
    const senderKeyDir = path.join(__dirname, '../keys', sender);
    const privateKeyPath = path.join(senderKeyDir, 'private.asc');
    if (!fs.existsSync(privateKeyPath)) {
        console.error(`Private key for ${sender} not found.`);
        return;
    }
    const privateKeyArmored = await fs.readFile(privateKeyPath, 'utf8');
    const encryptedPrivateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
    const privateKey = await openpgp.decryptKey({
        privateKey: encryptedPrivateKey,
        passphrase: 'your-secure-passphrase' // ← required if the key is encrypted
    });
    // console.log("Private key: ", privateKey);
    console.log(`Successfully read private key of ${sender}.`);
    return privateKey;
}


module.exports = encryptThenSign;