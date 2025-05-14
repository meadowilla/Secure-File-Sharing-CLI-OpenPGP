const mongoose = require('mongoose');
const MailSchema = new mongoose.Schema({
    Sender: String,
    Receiver: String,
    Done: Boolean,
    Data: String
});
module.exports = mongoose.model( "Mail", MailSchema, 'MailCollection'); // Export the model