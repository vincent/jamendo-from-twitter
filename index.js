
var events = require('events');
var async = require('async');
var util = require('util');

var elongate = require('elongate')
var Twitter = require('twitter');

var JamendoFromTwitter = function(conf) {
  events.EventEmitter.call(this);
  var self = this;

  // instanciate a twitter client
  this.twit = new Twitter(conf.twitter);

};
util.inherits(JamendoFromTwitter, events.EventEmitter);

/*
* where we pipe twitter stream data to our own emmitter
*/
JamendoFromTwitter.prototype.write = function(data){
	var self = this;

	data.fulltext = '';

	// append all orginal links to fulltext
	if (data.entities) {
		for (var i = 0; i < data.entities.urls.length; i++) {
			if (data.entities.urls[i] && data.entities.urls[i].expanded_url)
				data.fulltext += ' ' + data.entities.urls[i].expanded_url;
		}
	}

	// extract jamendo related data
	JamendoFromTwitter.extractData(data.fulltext, function(extracted){
		if (!extracted) {
			//console.log('no jamendo data in', data.text);
			return;
		}

		data = {
			// internal usage
			should		: data.should,
			extracted	: extracted,

			// osef
			id_str		: data.id_str,
			text			: data.text,
			user			: data.user
		};

		self.emit('message', data);
	});
};

JamendoFromTwitter.prototype.start = function(streamOptions) {
  var self = this;
  streamOptions = streamOptions || {};
	streamOptions.track = 'jamendo' ; //,listen to,is a fan of';
  
  this.twit.verifyCredentials(function(data) {
    if (streamOptions.track || streamOptions.follow || streamOptions.locations) {

      self.twit.stream('statuses/filter', streamOptions, function(stream){
        console.log("I'll listen with filters", util.inspect(streamOptions));
        stream.on('data', self.write);
      });

      self.twit.search(streamOptions.track, function(res){
        console.log("I'll also searched with filters", util.inspect(streamOptions.track));
				console.log('search yield ' + res.results.length + ' results');

				// search results do not have expanded_links
				// so we have to expand urls
				async.forEach(res.results,
					function(data_, cb){

						// extract links
						JamendoFromTwitter.expandLinks(data_.text, function(links){
							data_.entities = {
								urls: links
							};

							// eat this
							self.write(data_);
							cb(null);
						});
					},
					function(err){
						console.log('search done');
					});
			});

    } else {
      self.twit.stream('statuses/sample',function(stream){
        stream.on('data', self.write);
        console.log("I'm listenning to twitter samples, use parameters to customize");
      });
    }
  });
};

JamendoFromTwitter.expandLinks = function(text, callback) {

	var urls = text.match(/http:\/\/[^ ]+/ig);
	if (urls && urls.length > 0) {
		async.map(urls,
			function(url, next){
				elongate(url, function(err, expanded_url){
					next(null, { expanded_url: expanded_url });
				});
			},
			function(err, results){
				callback(results ? results : []);
			});
	
	} else {
		callback([]);
	}
};

JamendoFromTwitter.extractData = function(text, callback) {

	// find resource links
	var match = [],
			result = false,
			complex = null,
			reg = new RegExp("jamen.*do(.com|)/(en|es|fr|de)/([^ ]+)", "gi");

	// iterate over suposed jamendo ressources urls 
	while ((match = reg.exec(text)) !== null) {
		if (!result) result = {};

		/*
		match[0] = matched
		match[1] = tld
		match[2] = lang
		match[3] = path
		*/

		complex = match[3].split('/');

		// it's a trap^Wtrack !
		if (complex[0] == 't' || complex[0] == 'track') {
			if (!result.track_ids) result.track_ids = [];
			result.track_ids.push(complex[1]);

		// it's an artist
		} else if (complex[0] == 'l' || complex[0] == 'album' || complex[0] == 'list') {
			if (!result.playlist_ids) result.playlist_ids = [];
			result.playlist_ids.push(complex[1]);

		// it's an artist !
		} else if (complex[0] == 'a' || complex[0] == 'artist') {
			if (!result.artist_ids) result.artist_ids = [];
			result.artist_ids.push(complex[1]);

		} else {
			// not matched
			// if (!result.event_ids) result.event_ids = [];
		}
	}

	callback(result);
};

module.exports = JamendoFromTwitter;
