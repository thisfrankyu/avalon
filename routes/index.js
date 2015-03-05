var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(__dirname + '/../views/index.html');
});

module.exports = router;



