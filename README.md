# Install
```
$ git clone git@github.com:vincent/jamendo-from-twitter.git
$ cd jamendo-from-twitter
$ npm install
```

# Run in command line
```
$ node harvester.js
```

# Examples
From 
```
I'm listening to explain - attila jelinek on Jamendo http://jamen.do/t/691953
```
You should get
```
{ track_ids: [ 691953 ] }
```

From 
```
I'm listening to explain - attila jelinek on Jamendo http://t.co/tEQoxneNQu
```
You should get
```
{ playlist_ids: [ 'a74097' ] }
```


# Run in javascript
```
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
```

# Run Tests
```
$ node tests
```

# Run Grunt (jslint, docs)
```
$ grunt
```
