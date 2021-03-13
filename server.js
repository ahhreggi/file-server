const net = require('net');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);
const appendFile = util.promisify(fs.appendFile);
const writeFile = util.promisify(fs.writeFile);
const readdir = util.promisify(fs.readdir);
const { green, blue, red, yellow, white, cyan } = require('chalk');
const serverFilesDirectory = "./server-files/";

const server = net.createServer();
const actions = ["write", "read", "append", "delete", "find", "help", "quit"];

// Return an object containing client input arguments
const parseCommand = function(clientData) {
  const result = {
    action: undefined,
    filename: undefined,
    data: undefined
  };
  const params = clientData.trim().split(" ");
  result.action = params[0] ? params[0].toLowerCase() : null;
  result.filename = params[1] ? params[1].toLowerCase() : null;
  result.data = params[2] ? params.slice(2).join(" ") : null;
  return result;
};

// Return [true, ""] if the user's request contains valid arguments
// Otherwise, return [false, <error message>] if the request is invalid
const validateCommand = function(parsedCommand, validActions) {
  let { action, filename, data } = parsedCommand;
  let result = true;
  let msg = "";
  // If requesting anything other than a valid action, command is invalid
  if (!validActions.includes(action)) {
    result = false;
    msg = `'${action ? action : ''}' is not a valid command`;
  // If requesting WRITE, there must be a filename
  } else if (action === "write" && (filename === null)) {
    result = false;
    msg = "WRITE: must specify file name";
  // If requesting READ, there must be a filename
  } else if (action === "read" && filename === null) {
    result = false;
    msg = "READ: must specify file name";
  // If requesting APPEND, there must be a filename and data
  } else if (action === "append" && (filename === null || data === null)) {
    result = false;
    msg = "APPEND: must specify file name and data";
  // If requesting DELETE, there must be a filename
  } else if (action === "delete" && filename === null) {
    result = false;
    msg = "DELETE: must specify file name";
  // If requesting FIND, there must be a filename
  } else if (action === "find" && filename === null) {
    result = false;
    msg = "FIND: must specify file name to search for";
  }
  return [result, msg];
};

// Process command
const processCommand = function(clientObj, parsedCommand) {
  let { action, filename, data } = parsedCommand;
  console.log(`> ${cyan("Response sent.")}`);
  // If requesting HELP, send instructions
  if (action === "help") {
    sendInstructions(clientObj, true);
  } else if (action === "read") {
    clientObj.write(`> ${cyan(`Requesting to read '${white(filename)}'...`)}`);
    readRequest(filename)
      .then(data => {
        let result = "---------------------------------------------------------------\n";
        result += `${green(filename)}\n\n${white(data)}\n`;
        result += `---------------------------------------------------------------`;
        clientObj.write(result);
      })
      .catch(() => {
        clientObj.write(red(`\n    File '${white(filename)}' does not exist on the server!\n`));
      })
      .finally(() => {
        sendInstructions(clientObj, false, 10);
      });
  } else if (action === "delete") {
    clientObj.write(`> ${cyan(`Requesting to delete '${white(filename)}'...`)}`);
    deleteRequest(filename)
      .then(() => {
        clientObj.write(green(`\n    File '${white(filename)}' has been deleted.\n`));
      })
      .catch(() => {
        clientObj.write(red(`\n    File '${white(filename)}' does not exist on the server!\n`));
      })
      .finally(() => {
        sendInstructions(clientObj, false, 10);
      });
  } else if (action === "append") {
    clientObj.write(`> ${cyan(`Requesting to append data to '${white(filename)}'...`)}`);
    appendRequest(filename, data ? data : "")
      .then(() => {
        clientObj.write(green(`\n    Data appended to file: '${white(filename)}'\n`));
      })
      .catch(() => {
        clientObj.write(red(`\n    An error occurred while appending to the file.\n`));
      })
      .finally(() => {
        sendInstructions(clientObj, false, 10);
      });
  } else if (action === "write") {
    writeRequest(filename, data ? data : "")
      .then(() => {
        clientObj.write(green(`\n    Data written to file: '${white(filename)}'\n`));
      })
      .catch(() => {
        clientObj.write(red(`\n    An error occurred while writing to the file.\n`));
      })
      .finally(() => {
        sendInstructions(clientObj, false, 10);
      });
  } else if (action === "find") {
    findRequest()
      .then((files) => {
        let results = [];
        for (let file of files) {
          if (file.includes(filename)) {
            results.push(file);
          }
        }
        let resultStr = "---------------------------------------------------------------\n";
        resultStr += `${green(`Found ${results.length} result${results.length !== 1 ? "s" : ""} for '${white(filename)}':`)}\n\n${results.join("\n")}\n`;
        resultStr += `---------------------------------------------------------------`;
        clientObj.write(resultStr);
      })
      .catch((error) => {
        clientObj.write(red(`\n    An error occurred while searching for the file.\n`));
        console.log(error);
      })
      .finally(() => {
        sendInstructions(clientObj, false, 10);
      });
  }
};

// Send command instructions to the client
const sendInstructions = function(clientObj, verbose = false, delay = 0) {
  const prompt = `> Enter a command, ${yellow('HELP')}, or ${red('QUIT')}:`;
  let result = "";
  if (verbose) {
    result += "---------------------------------------------------------------\n";
    result += "[ HELP ]\n\n";
    result += `  Send a server request via '<${green('action')}> <${blue('filename')}> <${red('data')}>'\n`;
    result += `    > ${green('action')} = write, read, append, delete, find\n`;
    result += `    > ${blue('filename')} = the file name\n`;
    result += `    > ${red('data')} = the data to write\n`;
    result += "  Examples:\n";
    result += `    > ${white('write file.txt hello world')}\n`;
    result += "        Creates file.txt with the data 'hello world'\n";
    result += `    > ${white('read file.txt')}\n`;
    result += "        Displays contents of file.txt'\n";
    result += `    > ${white('append file.txt goodbye world')}\n`;
    result += "        Adds 'goodbye world' to the end of file.txt\n";
    result += `    > ${white('delete file.txt')}\n`;
    result += "        Deletes file.txt\n";
    result += `    > ${white('find .txt')}\n`;
    result += "        Displays files with names containing '.txt'\n";
    result += "---------------------------------------------------------------\n";
    result = yellow(result);
  }
  setTimeout(() => {
    clientObj.write((verbose ? result : "") + prompt);
  }, delay);
};

const readRequest = function(filename) {
  const path = `${serverFilesDirectory}${filename}`;
  return readFile(path);
};

const deleteRequest = function(filename) {
  const path = `${serverFilesDirectory}${filename}`;
  return unlink(path);
};

const appendRequest = function(filename, data) {
  const path = `${serverFilesDirectory}${filename}`;
  return appendFile(path, data);
};

const writeRequest = function(filename, data) {
  const path = `${serverFilesDirectory}${filename}`;
  return writeFile(path, data);
};

const findRequest = function() {
  const path = `${serverFilesDirectory}`;
  return readdir(path);
};

// Event Listeners
server.on('connection', (client) => {
  console.log(`> ${green('Client connected.')}`);
  client.setEncoding('utf8');
  client.write(`> ${cyan('Connection established.')}\n---------------------------------------------------------------`);
  setTimeout(() => {
    sendInstructions(client);
  }, 10);

  // Incoming data from client
  client.on('data', (clientData) => {
    const data = clientData.trim();
    // Parse client request command
    const cmd = parseCommand(data);
    // Validate client request command
    const validation = validateCommand(cmd, actions);
    // Log client request
    console.log(`> ${yellow(`[${validation[0] ? green("VALID") : red("INVALID")}] Request received: `) + data}`);
    // If the command is valid, process request, otherwise, send error message to client
    if (validation[0]) {
      processCommand(client, cmd);
    } else {
      client.write(`> ${red('ERROR:')} ${validation[1]}`);
      sendInstructions(client, false, 10);
    }
  });

  // Client closed connection
  client.on('close', () => {
    console.log(`> ${red('Client disconnected.')}`);
  });
});

// Server can run only on a specific port
// Only one server per port
server.listen(3001, () => {
  console.log(`> ${cyan('Server is online.')}`);
});