// This ensures that things do not fail silently but will throw errors instead.
"use strict";
// Server port
var express = require("express")
var app = express()

const fs = require('fs');
const morgan = require('morgan');
var HTTP_PORT = args.port || process.env.port || 5555;
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
    const stmt = db.prepare(`INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url,  protocol, httpversion, secure, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    const info = stmt.run(logdata.remoteaddr.toString(), logdata.remoteuser, logdata.time, logdata.method.toString(), logdata.url.toString(), logdata.protocol.toString(), logdata.httpversion.toString(), logdata.secure.toString(), logdata.status.toString(), logdata.referer, logdata.useragent.toString())
  
    next();
})

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

