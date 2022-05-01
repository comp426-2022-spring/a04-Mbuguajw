// Server port
var express = require("express");
var app = express();

const fs = require('fs');
const morgan = require('morgan');
const db = require("./database.js");
const args = require('minimist')(process.argv.slice(2));

console.log(args);
app.use(express.json());
app.use(express.urlencoded({ extended : true }));

var port = args.port || args.p || 5000;

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

if (args.help || args.h) {
  	console.log(help)
  	process.exit(0)
}

// Start server
const server = app.listen(port, () => {
	console.log("App listening on port %PORT%".replace("%PORT%",port))
});
// Use morgan for logging to files
// Create a write stream to append (flags: 'a') to a file
args['log']
args['debug']
args['port']

const log = args.log || 'true';

if (log == true) {
  	const WRITESTREAM = fs.createWriteStream('FILE', { flags: 'a' })
  	// Set up the access logging middleware
  	app.use(morgan('FORMAT', { stream: WRITESTREAM }))
}else {
  	console.log("ErrorErrorError");
}

app.use((req, res, next) => {
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
        referrer: req.headers['referer'],
        useragent: req.headers['user-agent']
    };
    console.log(logdata)
    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent)
    //console.log(info)
	next();
})

if (args.debug || args.d) {
    app.get('/app/log/access/', (req, res, next) => {
        const stmt = db.prepare("SELECT * FROM accesslog").all();
	    res.status(200).json(stmt);
    })

    app.get('/app/error/', (req, res, next) => {
        throw new Error('Error test works.')
    })
}

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