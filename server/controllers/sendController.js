const MailModel = require("../model/mailSchema");

const sendController = async (req, res) => {
  const { sender, recipient, filename, fileData } = req.body;
  if (!sender || !recipient || !filename || !fileData) {
    return res.status(400).json({ error: "Missing fields" });
  }
  
  try {
    const newMail = new MailModel({
      Sender: sender,
      Receiver: recipient,
      Done: false,
      Data: fileData,
    });
    await newMail.save();
    console.log(`> ${filename} sent successfully!`);
    res.status(200).json({ message: "File sent successfully" });
  } catch (err) {
    console.error("Error sending file:", err);
    return res.status(500).json({ error: "Error sending file" });
  }
}

module.exports = {sendController};