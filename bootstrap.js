var Telzio = Telzio || {};

Telzio.Bootstrap = function() {
	return this;
}

Telzio.Bootstrap.run = function(options) {
	
	this.options = {};

	if ( !options.elementId ) {
		console.log('elementId param is expected');
	}

	if ( !options.users ) {
		console.log('users param is expected');
	}

	this.options.elementId = options.elementId || 'telzioWidget';
	
	var today = new Date().toISOString().split('T')[0];

	this.options.dateFrom = options.dateFrom || today;
	this.options.dateTo = options.dateTo || today;
	this.options.apiKey = options.credentials.key;
	this.options.apiSecret = options.credentials.secret;

	this.options.users = options.users;

	this.client = {
			host: 'http://api.telzio.com',
			credentials: {
				apiKey: this.options.apiKey,
				apiSecret: this.options.apiSecret
			},
			paths: {
				log: '/calls/log',
				live: '/calls/live' 
			}
		};

	this.mock = {
		live: [
			{
				// An outbound call from sip
			    "Status": "ringing",
			    "Direction": "outbound",
			    "From": "somesipuser",
			    "To": "+1234567890",
			    "Started": "2015-12-11T11:03:09.97",
			    "Duration": "-00:00:02.1925553"
			},
			{
				// An outbound call from number
		        "Status": "in-progress",
		        "Direction": "inbound",
		        "From": "+1234567890",
		        "To": "+1234567890",
		        "Started": "2015-12-11T12:51:47.77",
		        "Duration": "00:01:44.0420537"
		    },
		    {
				// An inbound call from sip
		        "Status": "in-progress",
		        "Direction": "inbound",
		        "From": "+1234567890",
		        "To": "somesipuser",
				"Duration": "00:01:44.0420537"
		    },
		    {
				// An inbound call from number
		        "Status": "ringing",
		        "Direction": "inbound",
		        "From": "+1234567890",
		        "To": "+1234567890",
		        "Duration": "00:01:44.0420537"
		    }
		]
	};

	if ( document.getElementById(this.options.elementId) ) {

		var controller = new Telzio.Controller;
		controller.render(this.options.elementId, this.options.dateFrom, this.options.dateTo);
	}		
}