var EventEmitter = require('events').EventEmitter;

function newEmitter(){
    return new EventEmitter();
}

exports.newEmitter = newEmitter;
