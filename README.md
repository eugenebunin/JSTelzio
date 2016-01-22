# A JS widget for Telzio API
It shows statistics and info:
- calls count per person and total
- calls duration in hh:mm per person and total
- the current active calls

## Usage

Render a div element and set it to options object:

	<div id="telzio"></div>
	
	var options = {};
	options.elementId = 'telzio';

Add users with short (sip user) and number attributes:

	options.users = [
		{name: 'Anonymous', short: 'aa', number: '+1234567890', avatar: '<img src="avatar.png">'}
	];

Set a date period:

	var date = new Date();
	// From yesterday
	options.dateFrom = new Date(date.setDate(date.getDate()-1)).toISOString().split('T')[0];
	// Till today
  	options.dateTo = date.toISOString().split('T')[0];

Set API credentials:
	
	options.credentials = { key: 'apiKey', secret: 'apiSecret' };

### Simple usage

  	Telzio.Bootstrap.run(options);

### Autoupdated(every 10 sec) usage
	
	bootstraper();
    
	function bootstraper() {
		Telzio.Bootstrap.run(options);
		setTimeout(bootstraper, 10000);
	}
