// Require minimist module (make sure you install this one via npm).
// Require minimist module
const args = require('minimist')(process.argv.slice(2))
// See what is stored in the object produced by minimist
//console.log('Command line arguments: ', args)
// Store help text 
const help = (`
server.js [options]
--port, -p	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.
--debug, -d If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.
--help, -h	Return this message and exit.
`)
// If --help, echo help text and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}
// Define app using express
var express = require("express")
var app = express()
const fs = require('fs')
const morgan = require('morgan')
const db = require('./database.js')
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const HTTP_PORT = args.port || args.p || 5000

const server = app.listen(HTTP_PORT, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",HTTP_PORT))
});
// If --log=false then do not create a log file
if (args.log == 'false') {
    console.log("ERRORERRORERROR")
} else {
// Use morgan for logging to files
// Create a write stream to append to an access.log file
    const accessLog = fs.createWriteStream('access.log', { flags: 'a' })
    app.use(morgan('combined', { stream: accessLog }))
}
// log to database
app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referrer: req.headers['referer'],
        useragent: req.headers['user-agent']
    };
    console.log(logdata)
    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent)
    //console.log(info)
    next();
})

// Default API endpoint that returns 404 Not found for any endpoints that are not defined.
app.use(function(req, res){
    const statusCode = 404
    const statusMessage = 'NOT FOUND'
    res.status(statusCode).end(statusCode+ ' ' +statusMessage)
});

// Tell STDOUT that the server is stopped
process.on('SIGINT', () => {
    server.close(() => {
		console.log('\nApp stopped.');
	});
});

// Previous API Construction from last assignment

app.get('/app/', (req, res) => {
	// Respond with status 200
	res.statusCode = 200;
	// Respond with status message "OK"
	res.statusMessage = 'OK';
	//res.send('Hello World')
	// res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
	// res.end(res.statusCode+ ' ' +res.statusMessage);
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
	res.status(404).send('404 NOT FOUND');
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

if (args.debug || args.d) {
    app.get('/app/log/access/', (req, res, next) => {
        const stmt = db.prepare("SELECT * FROM accesslog").all();
	    res.status(200).json(stmt);
    })

    app.get('/app/error/', (req, res, next) => {
        throw new Error('Error test works.')
    })
}