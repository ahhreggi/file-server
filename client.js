const net = require('net');
const stdin = process.stdin;
const { red } = require('chalk');
stdin.setEncoding('utf8');
const client = net.createConnection({
  host: 'localhost',
  port: 3001
});
client.setEncoding('utf8');

// Incoming data from server
client.on('data', (data) => {
  console.log(data);
});

// Outgoing data to server
stdin.on('data', (input) => {
  if (input.trim().toLowerCase() === "quit") {
    console.log(`> ${red("Disconnected from server.")}`);
    process.exit();
  } else {
    client.write(input);
  }
});