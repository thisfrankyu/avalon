/**
 * Created by frank on 2/18/15.
 */
var EventEmitter = require('events').EventEmitter;

function newEmitter(){
    return new EventEmitter();
}

exports.newEmitter = newEmitter;