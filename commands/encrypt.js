const fs = require('fs-extra');
const path = require('path');
const openpgp = require('openpgp');
const fileType = require('file-type');
const {confirm} = require('@inquirer/prompts');

async function encryptThenSign(options) {
    const { file, sender, recipient, output } = options;
    const publicKey = await getRecipientPublicKey(recipient);

    // Continue with encryption and signing
    console.log(`> Generating session key...`);
    const sessionKey = await genSessionKey(publicKey);

    // Encrypt the file and session key
    console.log(`> Encrypting session key...`);
    const encryptedSessionKey = await encryptSessionKey(sessionKey, publicKey);
    console.log(`> Encrypting file...`);
    const encryptedFile = await encryptFile(file, sessionKey, output);
    const encryptedMessage = JSON.stringify({
        sender: sender,
        encryptedSessionKey: encryptedSessionKey,
        encryptedFile: encryptedFile,
    });

    // Sign message with sender's private key
    console.log(`> Signing message...`);
    const privateKey = await getSenderPrivateKey(sender);
    const signedMessage = await signMessage(encryptedMessage, privateKey);

    // Save the encrypted message and signature to a file
    const signedMessageFile = `${file}.enc.sig`;
    await fs.writeFile(signedMessageFile, signedMessage);
    console.log(`> ${signedMessageFile} ready to be sent!`);

    return {signedMessage};
}

async function signMessage(encryptedMessage, privateKey) {
    const signedMessage = await openpgp.sign({
        message: await openpgp.createMessage({ text: encryptedMessage }),
        signingKeys: [privateKey],
        format: 'armored',
    });
    return signedMessage;
}

async function encryptFile(file, sessionKey, output){
    // const outputFile = `${file}.enc` || output;

    // Check if the file exists
    if (!fs.existsSync(file)) {
        console.error(`File ${file} does not exist.`);
        return;
    }

    // Encrypt the file using the recipient's public key
    const fileData = await fs.readFile(file);
    const type = await fileType.fromBuffer(fileData);
    const mimeType = type ? type.mime : 'application/octet-stream';
    const isBinary = mimeType && !mimeType.startsWith('text/');
    const message = isBinary
    ? await openpgp.createMessage({ binary: fileData }) // For binary files
    : await openpgp.createMessage({ text: fileData.toString('utf8') }); // For text files

    const encryptedData = await openpgp.encrypt({
        message: message,
        sessionKey: sessionKey,
        format: 'armored',
    });
    return encryptedData;
}

async function encryptSessionKey(sessionKey, publicKey){
    const encryptedSessionKey = await openpgp.encryptSessionKey({
        encryptionKeys: [publicKey],
        format: 'armored',
        data: sessionKey.data,
        algorithm: 'aes256',
    });

    // Save the encrypted session key to a file
    // const sessionKeyFile = path.join(__dirname, `sessionKey.enc`);
    // await fs.writeFile(sessionKeyFile, encryptedSessionKey);
    // console.log(`Encrypted session key saved as ${sessionKeyFile}`);

    return encryptedSessionKey;
}

async function genSessionKey(publicKey){
    const sessionKey = await openpgp.generateSessionKey({
        encryptionKeys: [publicKey]
    });
    return sessionKey;
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

    // Check the fingerprint of the recipient's public key
    const fingerprint = publicKey.getFingerprint().toUpperCase();
    const formatted = fingerprint.match(/.{1,2}/g).join(':');
    console.log(`> ${recipient}’s OpenPGP fingerprint: ${formatted}`);

    const answer = await confirm(
        {
            message: `> Confirm this is the trusted key for ${recipient}?`,
            default: false
        }
    );

    if (!answer) {
        console.log('❌ Aborted. Unverified key.');
        process.exit(1);
    }

    console.log(`> Successfully read public key of ${recipient}.`);
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
    return privateKey;
}


module.exports = encryptThenSign;