'use strict';

var binding = require('bindings')('serialport.node');
var listLinux = require('./list-linux');

function LinuxBinding(opt) {
  if (typeof opt !== 'object') {
    throw new TypeError('options is not an object');
  }
  if (typeof opt.disconnect !== 'function') {
    throw new TypeError('options.disconnect is not a function');
  }
  this.disconnect = opt.disconnect;
  this.fd = null;
};

LinuxBinding.prototype.read = require('./read-unix');

LinuxBinding.prototype.open = function(path, options, cb) {
  if (typeof path !== 'string') {
    throw new TypeError('path is not a string');
  }

  if (typeof options !== 'object') {
    throw new TypeError('options is not an object');
  }

  if (typeof cb !== 'function') {
    throw new TypeError('cb is not a function');
  }

  if (this.isOpen) {
    process.nextTick(function() {
      cb(new Error('Already open'));
    });
    return;
  }
  binding.open(path, options, function(err, fd) {
    if (err) {
      return cb(err);
    }
    this.fd = fd;
    cb(null);
  }.bind(this));
};

LinuxBinding.prototype.close = function(cb) {
  if (!this.isOpen) {
    process.nextTick(function() {
      cb(new Error('Already closed'));
    });
    return;
  }

  binding.close(this.fd, function(err) {
    if (err) {
      return cb(err);
    }
    this.fd = null;
    cb(null);
  }.bind(this));
};

LinuxBinding.prototype.set = function(options, cb) {
  if (typeof options !== 'object') {
    throw new TypeError('options is not an object');
  }

  if (!this.isOpen) {
    return cb(new Error('Port is not open'));
  }
  binding.set(this.fd, options, cb);
};

LinuxBinding.prototype.write = function(buffer, cb) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('buffer is not a Buffer');
  }

  if (!this.isOpen) {
    return cb(new Error('Port is not open'));
  }

  binding.write(this.fd, buffer, cb);
};

var commonMethods = [
  'drain',
  'flush',
  'update',
  'get'
];

commonMethods.map(function(methodName) {
  LinuxBinding.prototype[methodName] = function() {
    var args = Array.prototype.slice.apply(arguments);
    if (!this.isOpen) {
      var cb = args.pop();
      process.nextTick(function() {
        cb(new Error('Port is not open'));
      });
      return;
    }
    args.unshift(this.fd);
    binding[methodName].apply(binding, args);
  };
});

Object.defineProperty(LinuxBinding.prototype, 'isOpen', {
  enumerable: true,
  get: function() {
    return this.fd !== null;
  }
});

LinuxBinding.list = listLinux;
module.exports = LinuxBinding;
