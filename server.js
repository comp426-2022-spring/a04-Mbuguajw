// This ensures that things do not fail silently but will throw errors instead.
"use strict";
// Require better-sqlite.



//Require more stuff if necessary


var express = require("express")
var app = express();
//const { debug } = require('console');
// Connect to a database or create one if it doesn't exist yet.
const db = require("./database.js");
const fs = require('fs');
const morgan = require('morgan');
// Is the database initialized or do we need to initialize it?
const stmt = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' and name='userinfo';`
    );
// Define row using `get()` from better-sqlite3
let row = stmt.get();
// Check if there is a table. If row is undefined then no table exists.
// if (row === undefined) {
// // Echo information about what you are doing to the console.
//     console.log('Your database appears to be empty. I will initialize it now.');
// // Set a const that will contain your SQL commands to initialize the database.
//     const sqlInit = `
//         CREATE TABLE userinfo ( id INTEGER PRIMARY KEY, username TEXT, password TEXT );
//         INSERT INTO userinfo (username, password) VALUES ('user1','supersecurepassword'),('test','anotherpassword');
//     `;
// // Execute SQL commands that we just wrote above.
//     db.exec(sqlInit);
// // Echo information about what we just did to the console.
//     console.log('Your database has been initialized with a new table and two entries containing a username and password.');
// } else {
// // Since the database already exists, echo that to the console.
//     console.log('Database exists.')
// }
// // Export all of the above as a module so that we can use it elsewhere.
module.exports = db
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

// Server port
var HTTP_PORT = 5000 
// Start server
const server = app.listen(HTTP_PORT, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",HTTP_PORT))
});
// Use morgan for logging to files
// Create a write stream to append (flags: 'a') to a file
if ((args.log || 'true') == 'true') {
    const WRITESTREAM = fs.createWriteStream('FILE', { flags: 'a' })
    // Set up the access logging middleware
    app.use(morgan('FORMAT', { stream: WRITESTREAM }))
}

if (args.debug || 'false') {
    app.get('/app/log/access', (req, res) => {
        try {
            // userinfo or accesslog?
            const stmt = db.prepare('SELECT * FROM userinfo').all()
            res.status(200).json(stmt)
        } catch(e) {
            console.error(e)
        }
    });
    app.get('/app/error', (req, res) => {
        throw new Error('Error test successful') // Express will catch this on its own.
    });
}

app.use( (req, res, next) => {
    // Your middleware goes here.
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }
    next();
})


// Previous API Construction from last assignment

app.get('/app/', (req, res) => {
    // Respond with status 200
    res.statusCode = 200;
    // Respond with status message "OK"
    res.statusMessage = 'OK';
    //res.send('Hello World')
    res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
    res.end(res.statusCode+ ' ' +res.statusMessage);
})

app.get('/app/flip/', (req, res) => {
    var flip = coinFlip();
    res.json({ "flip" : flip})
});

app.get('/app/flips/:number', (req, res) => {
    var flips = coinFlips(req.params.number);
    var stats = countFlips(flips);
    res.json({"raw" : flips, "summary" : stats});
});

app.get('/app/flip/call/heads', (req, res) => {
    const head = flipACoin('heads');
    res.json(head);
});

app.get('/app/flip/call/tails', (req, res) => {
    const tail = flipACoin('tails');
    res.json(tail);
});

app.use(function(req, res){
    res.status(404).send('404 NOT FOUND ENDPOINT');
    res.type("text/plain")
});

function coinFlip() {
  var num = Math.floor(Math.random()*100);
  if (num % 2 == 0) {
    return "heads"
  } 
  else {
    return "tails"
  }
}
  
function coinFlips(flips) {
  const results = new Array();
  for (let i=0; i < flips; i++) {
    results[i] = coinFlip();
  }
  return results;
}

function countFlips(array) {
  var heads = 0;
  var tails = 0;
  for (let i=0; i < array.length; i++) {
    if (array[i] == "heads") {
      heads += 1;
    }
    if (array[i] == "tails") {
      tails += 1;
    }
  }
  return {"heads": heads, "tails": tails};
}

function flipACoin(call) {
  var results = coinFlip();
  if (results == call) {
    return {call: call, flip: results, result: "win"};
  }
  else {
    return {call: call, flip: results, result: "lose"};
  }
}

