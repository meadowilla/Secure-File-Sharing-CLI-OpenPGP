const { MongoClient } = require("mongodb");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const receiveController = async (req, res) => {
    const { recipient } = req.body;
    if (!recipient) {
        return res.status(400).json({ error: "Missing recipient" });
    }
    // connect to the server
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db("MailDatabase");
        const collection = db.collection('MailCollection');
        const results = await collection.find({ Receiver: recipient, Done: false }).toArray();
        if (results.length === 0) {
            return res.status(404).json({ message: "No new files found" });
        }
        const fileData = results.map((mail) => ({
            Sender: mail.Sender,
            Receiver: mail.Receiver,
            Data: mail.Data,
        }));
        // Mark the files as done
        await collection.updateMany(
            { Receiver: recipient, Done: false },
            { $set: { Done: true } }
        );
        
        res.status(200).json({ message: "Files received successfully", files: fileData });

        // Save the files to the local file system
        const dir = path.join(__dirname, "../..", 'receivedFiles');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        fileData.forEach((file) => {
            const subDir = path.join(dir, file.Receiver);
              // Ensure subDir exists
            if (!fs.existsSync(subDir)) {
                fs.mkdirSync(subDir);
            }
            const now = new Date().toISOString().replace(/[:.]/g, '-');
            const filePath = path.join(subDir, `${file.Sender}_${now}.txt`);
            fs.writeFileSync(filePath, file.Data);
        });

        console.log(`> Files received successfully in folder receivedFiles/${recipient}`);
    } catch (err) {
        console.error("Error receiving file:", err);
        return res.status(500).json({ error: "Error receiving file" });
    } finally {
        await client.close();
    }
};

module.exports = { receiveController };
