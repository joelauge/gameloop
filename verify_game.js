const { spawn } = require('child_process');
const http = require('http');
const querystring = require('querystring');

// Set env vars for the server process
const env = { ...process.env, PORT: 3001, MOCK_SMS: 'true' };
const server = spawn('node', ['src/index.js'], { env, cwd: process.cwd() });

server.stdout.on('data', (data) => {
    console.log(`[SERVER]: ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR]: ${data}`);
});

function sendSms(from, body) {
    const postData = querystring.stringify({
        From: from,
        Body: body
    });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/sms',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };

    const req = http.request(options, (res) => {
        // console.log(`Sent: "${body}" -> Status: ${res.statusCode}`);
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

// Simulation Scenario
setTimeout(() => {
    console.log("--- TEST START: New User ---");
    sendSms('+15550100', 'Hello?');
}, 2000);

setTimeout(() => {
    console.log("--- TEST STEP: Select Game 1 ---");
    sendSms('+15550100', '1');
}, 4000);

setTimeout(() => {
    console.log("--- TEST STEP: Play Turn (Invalid Input) ---");
    sendSms('+15550100', 'dance');
}, 6000);

setTimeout(() => {
    console.log("--- TEST STEP: Play Turn (Valid Input) ---");
    sendSms('+15550100', 'sneak'); // Assuming 'sneak' might be an option, but options are random.
    // In a real robust test we'd parse the server output to know valid options, 
    // but here we just fire blindly to see if it catches or processes.
    // To be safer, let's send multiple options to hit one.
}, 8000);


setTimeout(() => {
    console.log("--- TEST END: Killing Server ---");
    server.kill();
    process.exit(0);
}, 12000);
