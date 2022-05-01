const args = require('minimist')(process.argv.slice(2))

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
// Define app using express
var express = require("express")
var app = express()
const fs = require('fs')
const morgan = require('morgan')
const db = require('./database.js')
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const port = args.port || args.p || 5000


const server = app.listen(port, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",port))
});

if (args.log == 'false') {
    console.log("ERRORERRORERROR")
} 
else {
    const accessLog = fs.createWriteStream('access.log', { flags: 'a' })
    app.use(morgan('combined', { stream: accessLog }))
}

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
    stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent)
    next();
})


// Previous API Construction from last assignment

app.get('/app/flip/', (req, res) => {
    const flip = coinFlip()
    res.status(200).json({ "flip" : flip })
});

app.post('/app/flip/coins/', (req, res, next) => {
    const flips = coinFlips(req.body.number)
    const count = countFlips(flips)
    res.status(200).json({"raw":flips,"summary":count})
})

app.get('/app/flips/:number', (req, res, next) => {
    const flips = coinFlips(req.params.number)
    const count = countFlips(flips)
    res.status(200).json({"raw":flips,"summary":count})
});

app.post('/app/flip/call/', (req, res, next) => {
    const game = flipACoin(req.body.guess)
    res.status(200).json(game)
})

app.get('/app/flip/call/:guess(heads|tails)/', (req, res, next) => {
    const game = flipACoin(req.params.guess)
    res.status(200).json(game)
})

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

app.use(function(req, res){
    const statusCode = 404
    const statusMessage = 'NOT FOUND'
    res.status(statusCode).end(statusCode+ ' ' +statusMessage)
});

process.on('SIGINT', () => {
    server.close(() => {
		console.log('\nApp stopped.');
	});
});