#!/usr/bin/env node

// modules dependencies
var conf      = require('./config');
  
// our scraping app
var JamendoFromTwitter = require('./index.js');

// get an harvester
var harvester = new JamendoFromTwitter(conf);

// we won't use twitter stream for real
// so we have to set a fake on_data listener
harvester.on('data', function(data){ });

// listener
harvester.on('message', function(message){
  console.log(message.should, message.extracted);
});

// tests
var tests = [

  /* with direct jamendo links */
  { should: 'Should find a track id',
    text: "I'm listening to explain - attila jelinek on Jamendo http://jamen.do/t/691953"
  },
  { should: 'Should find a track id',
    text: "@Jamendo users, check out the latest single by Kassy Key & the Raindoggs: http://jamen.do/t/1027911"
  },
  { should: 'Should find an artist id',
    text: "is a fan of attila jelinek http://jamen.do/a/359962"
  },
  { should: 'Should find a track id',
    text: "I'm listening to explain - attila jelinek on Jamendo http://t.co/TIWpHWb5LF",
    entities: {
      urls: [ { expanded_url: 'http://jamen.do/t/691953' } ]
    }
  },

  /* with short links */
  { expand_links: true,
    should: 'Should find a playlist id',
    text: "is a fan of attila jelinek http://t.co/tEQoxneNQu 'zfze fze"
  },
  { expand_links: true,
    should: 'Should find a track id',
    text: "is a fan of attila jelinek http://t.co/9fNJrR4pNI"
  }

];

// parse test data
for (var i = 0; i < tests.length; i++) {
  harvester.write(tests[i], function(error, data) {
    if (error) {
      console.log(error);
    } else {
      console.log(data);
    }
  });
}

// let the stream complete
setTimeout(function(){
  console.log('tests :', harvester.processed_count, 'passed /', tests.length);
} , 10000);




