#!/usr/bin/env node

// modules dependencies
var conf      = require('./config'),
    fs        = require('fs'),
    sys       = require('sys'),
    util      = require('util'),
    optimist  = require('optimist');
  
// quick & dirty modules
var locations = require('locations');

// our scraping app
var JamendoFromTwitter = require('./index.js');


// launcher options
var argv = optimist
    .describe('locations',  'Specifies a set of bounding boxes to track.')
    .describe('country',    'Specifies a country to track (will be translated to bounding box)')
    .describe('follow',     'A comma separated list of Twitter user IDs')
    //.describe('track',      'Keywords to track. Phrases of keywords are specified by a comma-separated list')
    .describe('countries',  'List of recognized countries')
    .describe('help',       'This help')
    .describe('debug',      'Debug mode')
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

var filters = ['debug', 'country', 'locations', 'track', 'follow'];
for (var i=0; i < filters.length; i++) {
  if (argv[filters[i]]) {
    streamOptions[filters[i]] = argv[filters[i]];
  }
}

// get an harvester
var harvester = new JamendoFromTwitter(conf);



// tests
harvester.on('message', function(message){
  if (message.should) {
    console.log(message.should + ': ', message.extracted);
  } else {
    console.log(message.extracted);
  }
});

harvester.write({
  should: 'Should find a track id',
  text: "I'm listening to explain - attila jelinek on Jamendo http://jamen.do/t/691953"
});
harvester.write({
  should: 'Should find a track id',
  text: "@Jamendo users, check out the latest single by Kassy Key & the Raindoggs: http://jamen.do/t/1027911"
});

harvester.write({
  should: 'Should find an artist id',
  text: "is a fan of attila jelinek http://jamen.do/a/359962"
});
harvester.write({
  should: 'Should find a track id',
  text: "I'm listening to explain - attila jelinek on Jamendo http://t.co/TIWpHWb5LF",
  entities: {
    urls: [
      { expanded_url: 'http://jamen.do/t/691953' }
    ]
  }
});

// start harvesting
harvester.start(streamOptions);

