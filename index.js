#!/usr/bin/env node

const { program } = require('commander');
const register = require('./commands/register');
const encryptThenSign = require('./commands/encrypt');


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
    .description('Encrypt a file securely')
    .requiredOption('-f, --file <file>', 'File to encrypt')
    .requiredOption('-s, --sender <sender>', 'Sender username')
    .requiredOption('-r, --recipient <recipient>', 'Recipient username')
    .option('-o, --output [output]', 'Output file name')
    .action(encryptThenSign);

program.parse(process.argv);