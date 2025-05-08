#!/usr/bin/env node

const { program } = require('commander');
const register = require('./commands/register');
const encryptThenSign = require('./commands/encrypt');
const verifyThenDecrypt = require('./commands/decrypt');


program
    .name("secure-file-sharing")
    .description("Secure file sharing CLI")
    .version("1.0.0");

program
    .command('register')
    .description('Generate a new key pair for a user')
    .requiredOption('-u, --username <username>', 'Username for the key pair')
    .action(register);

program
    .command('encryptSign')
    .description('Encrypt then sign a file securely')
    .requiredOption('-f, --file <file>', 'File to encrypt')
    .requiredOption('-s, --sender <sender>', 'Sender username')
    .requiredOption('-r, --recipient <recipient>', 'Recipient username')
    .option('-o, --output [output]', 'Output file name')
    .action(encryptThenSign);

program
    .command('verifyDecrypt')
    .description('Verify then decrypt a file securely')
    .requiredOption('-x, --signedMessageFile <signedMessageFile>', 'Encrypted signed message')
    .requiredOption('-r, --recipient <recipient>', 'Recipient username')
    .requiredOption('-s, --sender <sender>', 'Sender username')
    .action(verifyThenDecrypt);

program.parse(process.argv);