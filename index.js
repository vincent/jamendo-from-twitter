
var events = require('events');
var async = require('async');
var util = require('util');

var elongate = require('elongate');
var Twitter = require('twitter');

/**
 * 
 * @param {type} conf
 * @returns {JamendoFromTwitter}
 */
var JamendoFromTwitter = function(conf) {

  if (typeof conf !== 'undefined') {

    events.EventEmitter.call(this);
    var self = this;

    this.processed_count = 0;

    // instanciate a twitter client
    this.twit = new Twitter(conf.twitter);

  } else {

    console.log('Error: missing confirguration');

  }

};
util.inherits(JamendoFromTwitter, events.EventEmitter);

/**
 * 
 * where we pipe twitter stream data to our own emmitter
 * 
 * @param {type} data
 * @returns {unresolved}
 */
JamendoFromTwitter.prototype.write = function(data) {

  var self = this;

  // if we have to expand links
  // call me (maybe) later
  if (data.expand_links) {
    JamendoFromTwitter.expandLinks(data.text, function(links) {
      data.entities = {
        urls: links
      };
      data.expand_links = false;
      self.write(data);
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
      console.log('no jamendo data in', data.fulltext);
      return;
    }

    data = {
      // internal usage
      should: data.should,
      extracted: extracted,
      text: data.text,
      fulltext: data.fulltext,
      // osef
      id_str: data.id_str,
      user: data.user
    };

    self.processed_count++;

    self.emit('message', data);
  });
};

/**
 * 
 * @param {type} streamOptions
 * @returns {undefined}
 */
JamendoFromTwitter.prototype.start = function(streamOptions) {
  var self = this;
  streamOptions = streamOptions || {};
  //streamOptions.track = 'jamendo' ; //,listen to,is a fan of';

  this.twit.verifyCredentials(function(data) {

    if (streamOptions.track || streamOptions.follow || streamOptions.locations) {

      self.twit.stream('statuses/filter', streamOptions, function(stream) {

        console.log("I'll listen with filters", util.inspect(streamOptions));

        stream.on('data', self.write);

      });

      self.twit.search(streamOptions.track, function(res) {

        console.log(res);
        //console.log(res.statusCode);

        if (typeof res !== 'undefined' && res.search_metadata !== 'undefined') {

          if (typeof res.statuses !== 'undefined') {

            console.log("I'll also search with filters", util.inspect(streamOptions.track), ': ' + res.statuses.length + ' results');

            // search results do not have expanded_links
            // so we have to expand urls
            async.forEach(res.statuses,
                    function(data_, cb) {
                      // eat this
                      data_.expand_links = true;
                      self.write(data_);
                      cb(null);

                    },
                    function(err) {
                      console.log('Error: search failed');
                    }
            );

          } else {

            console.log('Error: no results');

          }

        } else {

          if (typeof res.statusCode !== 'undefined') {

            console.log('Error: ' + res.statusCode);

          }

          if (typeof res.data !== 'undefined') {

            var dataObject = JSON.parse(res.data);

            var messagesLength = dataObject.errors.length;

            for (var i = 0; i < messagesLength; i++) {

              console.log(dataObject.errors[i].message);

            }

          }

          if (typeof res.statusCode === '404') {

            console.log('Error not found. For a possible solution check out: https://gist.github.com/chrisweb/5939997');

          }

        }

      });

    } else {

      self.twit.stream('statuses/sample', function(stream) {

        stream.on('data', self.write);

        console.log("I'm listenning to twitter samples, use parameters to customize");

      });

    }
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
  var match = [],
          result = {nothing: true},
  complex = null,
          reg = new RegExp("jamen.*do(.com|)/(en/|es/|fr/|de/|)([^ ]+)", "gi");

  // iterate over suposed jamendo ressources urls 
  while ((match = reg.exec(text)) !== null) {
    /*
     match[0] = matched
     match[1] = tld
     match[2] = lang
     match[3] = path
     */

    complex = match[3].split('/');

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
