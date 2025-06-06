require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");   
const app = express();
const port = process.env.PORT || 3001;
const router = express.Router();
const {sendController} = require("./controllers/sendController");
const {receiveController} = require("./controllers/receiveController");

router.route("/send").post(sendController);
router.route("/receive").post(receiveController);

app.use(express.json());
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
app.use("/api", router);

module.exports = app;

try {
    const uri = process.env.MONGODB_MAILS_URI;
    mongoose.connect(uri);
    console.log("Connected to MongoDB");
} catch (error) {
    console.error("Cannot connect to MongoDB!", error);
    process.exit(1);
}

