# File Server

File server and client where:
- Clients can connect to the server via TCP and send requests via commands to:
  - Create a file on the server
  - Read a file on the server
  - Append data to a file on the server
  - Delete a file on the server
  - Search for files on the server
- The server parses and validates commands before fulfilling the request


## Installation & Usage
1. Clone or download this repository
    ```
    git clone https://github.com/ahhreggi/file-server
    ```
2. In the project directory, install dependencies
    ```
   npm install
    ```
3. Start the server
    ```
    node server
    ```
4. In another terminal window, connect to the server
    ```
    node client
    ```
    Sample output (server):
    ```
    > Server is online.
    > Client connected.
    > [VALID] Request received: help
    > Response sent.
    > [VALID] Request received: read file.txt
    > Response sent.
    ```
    Sample output (client):
    ```
    > Connection established.
    ---------------------------------------------------------------
    > Enter a command, HELP, or QUIT:
    help
    ---------------------------------------------------------------
    [ HELP ]

      Send a server request via '<action> <filename> <data>'
        > action = write, read, append, delete, find
        > filename = the file name
        > data = the data to write
      Examples:
        > write file.txt hello world
            Creates file.txt with the data 'hello world'
        > read file.txt
            Displays contents of file.txt'
        > append file.txt goodbye world
            Adds 'goodbye world' to the end of file.txt
        > delete file.txt
            Deletes file.txt
        > find .txt
            Displays files with names containing '.txt'
    ---------------------------------------------------------------
    > Enter a command, HELP, or QUIT:
    read file.txt
    > Requesting to read 'file.txt'...
    ---------------------------------------------------------------
    file.txt

    hello world
    ---------------------------------------------------------------
    > Enter a command, HELP, or QUIT:
    ```