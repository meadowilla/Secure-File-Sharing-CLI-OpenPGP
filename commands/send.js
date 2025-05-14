const fs = require("fs");
async function sendFile(options) {
    const {file, sender, recipient} = options;
    console.log(`> Sending file ${file} from ${sender} to ${recipient}...`);
    const body = {
        sender: sender,
        recipient: recipient,
        filename: file,
        fileData: fs.readFileSync(file, "utf8"),
    };
    // connect to the server
    const url = "http://localhost:3001";
    const postRequest = url + "/api/send";
    console.log(`> Sending request to ${postRequest}`);

    console.log(`> Body: ${JSON.stringify(body)}`);
    const response = await fetch(postRequest, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    console.log(`> Response: ${response.status}`);
}

module.exports = sendFile;