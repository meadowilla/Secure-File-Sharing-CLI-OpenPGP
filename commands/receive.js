async function receiveFile(options) {
    const {recipient} = options;
    console.log(`> Fetching new file sent to ${recipient}...`);
    const body = {
        recipient: recipient,
    };
    // connect to the server
    const url = "http://localhost:3001";
    const postRequest = url + "/api/receive";

    const response = await fetch(postRequest, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    console.log("> Server status:", response.status);
}

module.exports = receiveFile;