# Install
```
$ git clone git@github.com:vincent/jamendo-from-twitter.git
$ npm install
```

# Run in command line
```
$ node harvester.js
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
  console.log(message.extracted)
})

// start harvesting
harvester.start()
```

# Run Grunt (jslint, docs)
```
$ grunt
```
