var proxy = require('express-http-proxy')
var express = require('express')
var backend = require('./backend/server.js')    //Backends starts by itself

var app = express()

var port = '8080'

app.use(express.static('dist', {extensions:['html']}));
app.use('/api', proxy('localhost:3000', {proxyReqPathResolver: (req) => {return "/api"+req.url}}));

app.listen(port);

console.log("Webserver listening on port " + port + "\nConnect to http://localhost:" + port)
