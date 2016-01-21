# A JS widget that shows statistics from Telzio API

## Usage
	
First add your sip users with short (sip user) and number attributes:
	
	var users = [
		{name: 'Anonymous', short: 'aa', number: '+1234567890', avatar: '<img src="avatar.png">'}
	];

Set a date period:

	var date = new Date();
  	var today = date.toISOString().split('T')[0];
  	var yesterday = new Date(date.setDate(date.getDate()-1)).toISOString().split('T')[0];

	
### Fixed usage

  	Telzio.Bootstrap.run({
	    credentials: {key: 'change me', secret: 'change me'},
	    elementId : 'telzioWidget', dateFrom: yesterday, dateTo: today,
	    users: users
  	});

### Autoupdated usage

    bootstraper();

    function bootstraper() {

    	Telzio.Bootstrap.run({
      		credentials: {key: 'change me', secret: 'change me'},
        	elementId : 'widgetDay', dateFrom: yesterday, dateTo: today,
        	users: users
      	});

      	setTimeout(bootstraper, 10000);
    }