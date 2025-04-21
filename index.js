#!/usr/bin/env node

const { program } = require('commander');
const register = require('./commands/register');


program
    .name("secure-file-sharing")
    .description("Secure file sharing CLI")
    .version("1.0.0");

program
    .command('register')
    .description('Generate a new key pair for a user')
    .requiredOption('-u, --username <username>', 'Username for the key pair')
    .action(register);

program.parse(process.argv);