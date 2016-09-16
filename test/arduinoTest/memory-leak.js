'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var SerialPort = require('../../lib/serialport');
var heapdump = require('heapdump');

var port = process.env.TEST_PORT;

if (!port) {
  console.error('Please pass TEST_PORT environment variable');
  process.exit(1);
}

if (!global.gc) {
  console.error('please run with node --expose-gc');
  process.exit(1);
}

// setInterval(function() {
//   // console.log('forcing GC');
//   global.gc();
//   console.log(process.memoryUsage());
// }, 1000);

// function dumpHeap() {
//   console.log('Dumping heap');
//   heapdump.writeSnapshot();
// }

// setTimeout(dumpHeap, 6000);
// setInterval(dumpHeap, 30000);

var counter = 0;

function startPromise() {
  var serialPort;
  return new Promise((resolve, reject) => {
    counter++;
    if (counter % 1000 === 0) {
      console.log('Attempt ' + counter);
      global.gc();
      console.log(process.memoryUsage());
      heapdump.writeSnapshot();
    }
    var options = {
      baudrate: 115200,
      autoOpen: false
    };
    serialPort = new SerialPort(port, options);
    serialPort.open(err => err ? reject(err) : resolve());
  })
  .then(() => {
    return new Promise((resolve, reject) => {
      serialPort.close(err => {
        serialPort.removeAllListeners();
        err ? reject(err) : resolve();
      })
    });
  })
  .then(startPromise);
}

startPromise().then(function() {
  process.exit(0);
}, function(err) {
  console.error(err);
  process.exit(1);
});
