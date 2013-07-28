#!/usr/bin/env node

// modules dependencies
var fs        = require('fs'),
    sys       = require('sys'),
    util      = require('util'),
    optimist  = require('optimist');

// optional config
var conf = { twitter: { } };
try {
  conf       = require('./config');
} catch (err) {
  // no config, must be given as arguments
}


// quick & dirty modules
var locations = require('locations');

// our scraping app
var JamendoFromTwitter = require('./index.js');


// launcher options
var argv = optimist
    .describe('locations',          'Specifies a set of bounding boxes to track.')
    .describe('country',            'Specifies a country to track (will be translated to bounding box)')
    .describe('follow',             'A comma separated list of Twitter user IDs')
    //.describe('track',            'Keywords to track. Phrases of keywords are specified by a comma-separated list')
    .describe('countries',          'List of recognized countries')
    .describe('help',               'This help')
    .describe('consumer-key',       'Your Twitter consumer key')
    .describe('consumer-secret',    'Your Twitter consumer secret')
    .describe('access-token-key',   'Your Twitter access token key')
    .describe('access-token-secret','Your Twitter access token secret')
    .describe('debug',              'Debug mode')
    .argv;

// parse args
var streamOptions = {};

if (argv.help) {
  optimist.showHelp();
  process.exit();
}

if (argv.countries) {
  console.log(locations.countries);
  process.exit();
}

if (argv.country && locations.countries[argv.country]) {
  argv.locations = locations.countries[argv.country].loc;
}

var key, auth = ['consumer-key', 'consumer-secret', 'access-token-key', 'access-token-secret'];
for (var i=0; i < auth.length; i++) {
  if (argv[auth[i]]) {
    key = auth[i].replace(/-/g, '_');
    conf.twitter[key] = argv[auth[i]];
  }
}

var filters = ['debug', 'country', 'locations', 'track', 'follow'];
for (var i=0; i < filters.length; i++) {
  if (argv[filters[i]]) {
    streamOptions[filters[i]] = argv[filters[i]];
  }
}

// get an harvester
var harvester = new JamendoFromTwitter(conf);

// listener
harvester.on('message', function(message){
  console.log(JSON.stringify(message.extracted));
});

// start harvesting
harvester.start(streamOptions);

