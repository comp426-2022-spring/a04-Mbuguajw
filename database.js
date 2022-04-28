
//const { debug } = require('console');
// Connect to a database or create one if it doesn't exist yet.
// const db = require("./database.js");
const Database = require('better-sqlite3');
const db = new Database('log.db');

// Is the database initialized or do we need to initialize it?

const stmt = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' and name='userinfo';`
    );
// Define row using `get()` from better-sqlite3
let row = stmt.get();
// Check if there is a table. If row is undefined then no table exists.
if (row === undefined) {
// Echo information about what you are doing to the console.
    console.log('Your database appears to be empty. I will initialize it now.');
// Set a const that will contain your SQL commands to initialize the database.
    const sqlInit = `
        CREATE TABLE userinfo ( id INTEGER PRIMARY KEY, username TEXT, password TEXT );
        INSERT INTO userinfo (username, password) VALUES ('user1','supersecurepassword'),('test','anotherpassword');
    `;
// Execute SQL commands that we just wrote above.
    db.exec(sqlInit);
// Echo information about what we just did to the console.
    console.log('Your database has been initialized with a new table and two entries containing a username and password.');
} else {
// Since the database already exists, echo that to the console.
    console.log('Database exists.')
}
// Export all of the above as a module so that we can use it elsewhere.
const args = require('minimist')(process.argv.slice(2));

const help = (`server.js [options] --port	Set the port number for the server to listen on. Must be an integer
between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
a JSON access log from the database and /app/error which throws 
an error with the message "Error test successful." Defaults to 
false.

--log		If set to false, no log files are written. Defaults to true.
Logs are always written to database.

--help	Return this message and exit.
`)

if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}
module.exports = db