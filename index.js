
var events = require('events');
var async  = require('async');
var util   = require('util');

var elongate = require('elongate');
var Twitter = require('twitter');

/**
 * 
 * @param {type} conf
 * @returns {JamendoFromTwitter}
 */
var JamendoFromTwitter = function(conf) {

  if (typeof conf === 'undefined' || !conf.twitter || !conf.twitter.access_token_key) {

    console.log('Error: missing configuration');
    process.exit(1);

  } else {

    events.EventEmitter.call(this);
    var self = this;

    this.processed_count = 0;

    // instanciate a twitter client
    this.twit = new Twitter(conf.twitter);

  }

};

util.inherits(JamendoFromTwitter, events.EventEmitter);

/**
 * 
 * @param {type} streamOptions
 * @returns {undefined}
 */
JamendoFromTwitter.prototype.startStream = function(streamOptions) {
  
  var self = this;

  var self = this;

  streamOptions = streamOptions || {};

  this.twit.get('/account/verify_credentials', function(error, payload) {
    
    if (streamOptions.track || streamOptions.follow || streamOptions.locations) {

      self.twit.stream('statuses/filter', streamOptions, function(stream) {

        console.log('I\'ll listen with filters', util.inspect(streamOptions));

        stream.on('data', function(data) {
            
            self.write(data, function(error, message) {
                
                if (!error) {
                
                    self.emit('message', message);
                    
                } else {
                    
                    self.emit('error', error);
                    
                }

            });
            
        });

      });

    } else {

      self.twit.stream('statuses/sample', function(stream) {

        console.log('I\'m listenning to twitter samples, use parameters to customize');

        stream.on('data', function(data) {
            
            self.write(data, function(error, message) {
                
                if (!error) {
                
                    self.emit('message', message);
                    
                } else {
                    
                    self.emit('error', error);
                    
                }

            });
            
        });

      });

    }
  });
};

JamendoFromTwitter.prototype.executeSearch = function(searchOptions) {

    var self = this;
    
    self.twit.get('/search/tweets', searchOptions.track, function(error, payload) {
      
      if (!error) {

        if (typeof payload !== null) {

          console.log('I\'ll also search with filters', util.inspect(searchOptions.track), ': ' + payload.statuses.length + ' results');

          // search results do not have expanded_links
          // so we have to expand urls
          async.forEach(payload.statuses,
            function(data, callback) {
              // eat this
              data.expand_links = true;
              
              self.write(data, function(error, message) {

                  if (!error) {

                      self.emit('message', message);

                  } else {

                      self.emit('error', error);

                  }

              });
                
              callback(null);

            },
            function(error) {
              self.emit('error', { message: 'Error: search failed', original_error: error });
            }
          );

        } else {

          self.emit('error', { message: 'Error: no results' });

        }

      } else {

        self.emit('error', { message: 'Error: search failed', original_error: error });

      }

    });

};

/**
 * 
 * where we pipe twitter stream data to our own emmitter
 * 
 * @param {type} data
 * @param {type} callback
 * @returns {unresolved}
 */
JamendoFromTwitter.prototype.write = function(data, callback) {

  var self = this;

  // if we have to expand links
  // call me (maybe) later
  if (data.expand_links) {
    JamendoFromTwitter.expandLinks(data.text, function(links) {
      data.entities = {
        urls: links
      };
      data.expand_links = false;
      self.write(data, callback);
    });
    return;
  }

  data.fulltext = data.text;

  // append all orginal links to fulltext
  if (data.entities) {
    for (var i = 0; i < data.entities.urls.length; i++) {
      if (data.entities.urls[i] && data.entities.urls[i].expanded_url) {
        data.fulltext += ' ' + data.entities.urls[i].expanded_url;
      }
    }
  }

  // extract jamendo related data
  JamendoFromTwitter.extractData(data.fulltext, function(extracted) {
    
    if (extracted.nothing) {
      callback({ message: 'no jamendo data in' }, null);
    }

    data = {
      // internal usage
      should: data.should,
      extracted: extracted,
      text: data.text,
      fulltext: data.fulltext,
      // osef
      id_str: data.id_str,
      user: data.user,
      // raw
      raw: data
    };

    self.processed_count++;

    callback(false, data);
    
  });
  
};

/**
 * 
 * @param {type} text
 * @param {type} callback
 * @returns {undefined}
 */
JamendoFromTwitter.expandLinks = function(text, callback) {

  var urls = text.match(/http:\/\/[^ ]+/ig);
  if (urls && urls.length > 0) {
    async.map(urls,
      function(url, next) {
        elongate(url, function(err, expanded_url) {
          next(null, {expanded_url: expanded_url});
        });
      },
      function(err, results) {
        callback(results ? results : []);
      }
    );

  } else {
    callback([]);
  }
};

/**
 * 
 * @param {type} text
 * @param {type} callback
 * @returns {undefined}
 */
JamendoFromTwitter.extractData = function(text, callback) {

  // find resource links
  var match,
    result = {nothing: true},
    complex = null,
    reg = new RegExp('(jamen.do|jamendo.com)/(en/|es/|fr/|de/|pl/|it/|)([^ ]+)', 'gi');

  // iterate over suposed jamendo ressources urls 
  while ((match = reg.exec(text)) !== null) {

    //match[0] = matched
    //match[1] = domain
    //match[2] = lang
    //match[3] = path
    //match[4] = index
    //match[5] = input

    complex = match[3].split('/');
    
    //console.log(match);
    //console.log(complex);

    // it's a trap^Wtrack !
    if (complex[0] === 't' || complex[0] === 'track') {
      if (!result.track_ids) {
        result.track_ids = [];
      }
      result.track_ids.push(complex[1]);
      result.nothing = false;

      // it's an artist
    } else if (complex[0] === 'l' || complex[0] === 'album' || complex[0] === 'list') {
      if (!result.playlist_ids) {
        result.playlist_ids = [];
      }
      result.playlist_ids.push(complex[1]);
      result.nothing = false;

      // it's an artist !
    } else if (complex[0] === 'a' || complex[0] === 'artist') {
      if (!result.artist_ids) {
        result.artist_ids = [];
      }
      result.artist_ids.push(complex[1]);
      result.nothing = false;

    } else {
      // not matched
      // if (!result.event_ids) result.event_ids = [];
    }
  }

  callback(result);
  
};

module.exports = JamendoFromTwitter;