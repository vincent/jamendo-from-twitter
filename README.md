# Install
```bash
$ git clone git@github.com:vincent/jamendo-from-twitter.git
$ cd jamendo-from-twitter
$ npm install
```

# Run in command line
```bash
$ node harvester.js
```

# Examples
From 
```
I'm listening to explain - attila jelinek on Jamendo http://jamen.do/t/691953
```
You should get
```json
{ "track_ids": [ "691953" ] }
```

From 
```
I'm listening to attila on Jamendo http://t.co/tEQoxneNQu
```
You should get
```json
{ "playlist_ids": [ "a74097" ] }
```


# Run in javascript
```javascript
// import module
var JamendoFromTwitter = require('jamendo-from-twitter')

// get an harvester
var harvester = new JamendoFromTwitter({
	twitter: twitter_app_credentials_see_config_sample
})

// listen to message events
harvester.on('message', function(message){
	// message.extracted contains jamendo data
	console.log(message.extracted)
})

// start harvesting
harvester.start()

// or write data directly
harvester.write({ text: "I'm listening to attila on Jamendo http://jamen.do/t/691953" })

// also with short links, just set the expand_links attribute
harvester.write({ text: "is a fan of attila jelinek http://t.co/9fNJrR4pNI", expand_links: true })
```

# Run Tests
```bash
$ node tests
```

# Run Grunt (jslint, docs)
```bash
$ grunt
```
