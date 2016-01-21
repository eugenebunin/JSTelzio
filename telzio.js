var Telzio = Telzio || {};

String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
}

Number.prototype.toHHMMSS = String.prototype.toHHMMSS;

Date.prototype.yyyymmdd = function() {
	var yyyy = this.getFullYear().toString();
	var mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
	var dd = this.getDate().toString();
	return yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]); // padding
};

String.prototype.contains = function(string) {
	return this.indexOf(string) != -1;
};

Telzio.Helper = function() {

}

Telzio.Helper.User = {
}

Telzio.Helper.User.contains = function(user, string) {
	
	// Search for user by number
	if (user.number.trim().replace(/ /g, '') == string.trim().replace('/+/1', '').replace(/ /g, '')) {
		return true;
	}
	// Search for short name
	else if (string.contains(user.short)) {
		return true;
	} else {

		var short = string.substr(0, string.indexOf('@') - 2);
		var s = short.replace("sip:", "");

		if (user.short == s) {
			return true;
		}
	}

	// User do not present in a string
	return false;
}

Telzio.Statistics = function() {
	return this;
}

Telzio.Statistics.make = function(logCollection, liveCollection) {
	
	this.liveCollection = liveCollection;
	this.logCollection = logCollection;

	var instance = this;

	this.users = Telzio.Bootstrap.options.users;
	var result = [];

	for (i in this.users) {

		var user = this.users[i];

		var callsOutbound = instance.logCollection.outboundForUser(user);
		var callsInbound = instance.logCollection.inboundForUser(user);
		var outboundDuration = instance.logCollection.outboundDurationForUser(user);
		var inboundDuration = instance.logCollection.inboundDurationForUser(user);

		user.calls_total = callsOutbound.length + callsInbound.length;
		user.calls_inbound = callsInbound.length;

		user.duration_inbound = inboundDuration.toHHMMSS();
		user.duration_total = (outboundDuration + inboundDuration).toHHMMSS();

		user.status = instance.liveCollection.userStatus(user);

		if (user.calls_total > 0 || user.status) {

			result.push(user);
		}
	}

	result.sort( function(a, b) { return (b.calls_total - a.calls_total); });

	return result;
}

Telzio.LiveCollection = function(data) {
	
	this.data = data;
	
	return this;
}

Telzio.LiveCollection.prototype.make = function(callback) {
	
	var instance = this;
	
	var xhr = new XMLHttpRequest();
	var url = Telzio.Bootstrap.client.host + Telzio.Bootstrap.client.paths.live;
	xhr.open('get', url);

	xhr.setRequestHeader('Authorization', 'Basic ' + btoa(Telzio.Bootstrap.client.credentials.apiKey + ':' + Telzio.Bootstrap.client.credentials.apiSecret));
	
	xhr.send();
	
	xhr.onreadystatechange = function(onSuccess, onFail) {

		if ( xhr.readyState == 4 ) {
			if ( xhr.status >= 200 && xhr.status <= 400) {
				
				var response = JSON.parse(xhr.responseText);
				
				// Success
				callback( new Telzio.LiveCollection(response.LiveCalls) );
				
			}
			else {
				// Error
				console.log('Could not get response from Telzio. Status: ' + xhr.status);
			}
		}
	}
}

Telzio.LiveCollection.prototype.forFrom = function(user) {
	
	for ( var i in this.data ) {
		
		var model = this.data[i];

		if ( Telzio.Helper.User.contains(user, model.From) ) {
			return this.data[i];
		}
	}
	
	return null;
}

Telzio.LiveCollection.prototype.forTo = function(user) {
	
	for ( var i in this.data ) {
		
		var model = this.data[i];

		if ( Telzio.Helper.User.contains(user, model.To) ) {
			return this.data[i];
		}
	}
	
	return null;
}

Telzio.LiveCollection.prototype.userStatus = function(user) {
	
	var result = this.forFrom(user);
	
	if ( !result ) {
		result = this.forTo(user);
	}
	
	var status = result ? result.Status : '';
	
	return status;
}
	
Telzio.LogCollection = function(data) {
	
	this.data = data;
	
	if ( data ) {
		this.data = data;
	}
		
	return this;
	
};

Telzio.LogCollection.prototype.make = function(fromDate, toDate, offset, callback) {
	
	this.fromDate = fromDate ? fromDate: '';
	this.toDate = toDate ? toDate : '';
	this.callback = callback;
	this.offset = offset ? offset : 0;

	var instance = this;
	
	var xhr = new XMLHttpRequest();
	var url = Telzio.Bootstrap.client.host + Telzio.Bootstrap.client.paths.log + '?fromDate=' + this.fromDate + '&' + 'toDate=' + this.toDate + '&offset=' + this.offset;
	
	this.offset += 20;
	
	xhr.open('get', url);

	xhr.setRequestHeader('Authorization', 'Basic ' + btoa(Telzio.Bootstrap.client.credentials.apiKey + ':' + Telzio.Bootstrap.client.credentials.apiSecret));
	
	xhr.send();
		
	xhr.onreadystatechange = function(onSuccess, onFail) {

		if ( xhr.readyState == 4 ) {
			if ( xhr.status >= 200 && xhr.status <= 400) {
				
				var response = JSON.parse(xhr.responseText);
				calls = response.Calls;
				
				for ( var i in calls ) {
					instance.data.push(calls[i]);	
				}
				
				if ( calls.length == 20 ) {
					instance.make(instance.fromDate, instance.toDate, instance.offset, instance.callback);
				}
				else {
					// Success
					callback( new Telzio.LogCollection(instance.data) );
					
				}				
				
			}
			else {
				// Error
				console.log('Could not get response from Telzio. Status: ' + xhr.status);
			}
		}
	}
	
};

Telzio.LogCollection.prototype.outboundForUser = function(user) {
	
	var result = [];
	
	for ( var i in this.data ) {

		var model = this.data[i];

		if ( Telzio.Helper.User.contains(user, model.From) ) {

			var a = model.Duration.split(':');
			var duration = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);

			if ( duration > 0 ) {
				result.push(this.data[i]);
			}
		}
	}
	
	return result;
}

Telzio.LogCollection.prototype.inboundForUser = function(user) {
	
	var result = [];
	
	for ( var i in this.data ) {

		var model = this.data[i];

		if ( Telzio.Helper.User.contains(user, model.To) ) {

			var a = model.Duration.split(':');
			var duration = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);

			if ( duration > 0 ) {
				result.push(this.data[i]);
			}
		}
	}
	
	return result;
}

Telzio.LogCollection.prototype.outboundDurationForUser = function(user) {
	
	var count = 0;
	
	for ( var i in this.data ) {
		
		var model = this.data[i];

		if ( Telzio.Helper.User.contains(user, model.From) ) {

			var hms = this.data[i].Duration;
			
			var a = hms.split(':');
			var duration = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
			
			count += duration;
		}
	}
	
	return count;
}

Telzio.LogCollection.prototype.inboundDurationForUser = function(user) {
	
	var count = 0;
	
	for ( var i in this.data ) {
		
		var model = this.data[i];

		if ( Telzio.Helper.User.contains(user, model.To) ) {

			var hms = this.data[i].Duration;
			
			var a = hms.split(':');
			var duration = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
			
			count += duration;
		}
	}
	
	return count;
}

Telzio.LogCollection.prototype.inboundDurationForAll = function() {
	
	var count = 0;
	
	for ( var i in this.data ) {
		var model = this.data[i];
		
		if ( model.Direction == 'inbound' ) {

			var hms = model.Duration;
			
			var a = hms.split(':');
			var duration = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
			
			count += duration;
		}
	}
	
	return count;
}

Telzio.LogCollection.prototype.outboundDurationForAll = function() {
	
	var count = 0;
	
	for ( var i in this.data ) {
		var model = this.data[i];
		
		if ( model.Direction == 'outbound' ) {

			var hms = model.Duration;
			
			var a = hms.split(':');
			var duration = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
			
			count += duration;
		}
	}
	
	return count;
}

Telzio.LogCollection.prototype.durationForAll = function() {
	
	var count = 0;
	
	for ( var i in this.data ) {
		var model = this.data[i];
		
		var hms = model.Duration;
		
		var a = hms.split(':');
		var duration = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
		
		count += duration;
	}
	
	return count;
}

Telzio.LogCollection.prototype.inboundForAll = function() {
	
	var result = [];
	
	for ( var i in this.data ) {
		
		var model = this.data[i];
		
		if ( model.Direction == 'inbound' ) {

			var a = model.Duration.split(':');
			var duration = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
			
			if (duration > 0) {
				result.push(model);
			}
		}
	}
	
	return result;
}

Telzio.LogCollection.prototype.outboundForAll = function() {
	
	var result = [];
	
	for ( var i in this.data ) {
		
		var model = this.data[i];
		
		if ( model.Direction == 'outbound' ) {
			
			var a = model.Duration.split(':');
			var duration = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
			
			if (duration > 0) {
				result.push(model);
			}
		}
	}
	
	return result;	
}

Telzio.View = function(collection, attributes) {
	
	this.collection = collection;
	this.attributes = attributes;
	
	return this;
}

Telzio.View.prototype.make = function(item) {
	
	var html = '<tr>' +
	'<td>{avatar}</td>' + 
	'<td>{name}</td>' +
    '<td>{calls_total} ({calls_inbound})</td>' +
    '<td>{duration_total} ({duration_inbound})</td>' +
    '<td><span class="label label-danger">{status}</span></td>' +
    '</tr>';
	
	html = html.replace(/\{[^\}]*\}/g, function(key) {
        return item[key.slice(1,-1)];
    });
	
	return html;
}

Telzio.View.prototype.render = function(element) {
	
	var header = '<table class="table">' +
	'<thead><tr>' +
		'<th style="width:50px"></th>' +
		'<th style="width:100px">Name</th>' +
		'<th style="width:50px">Calls</th>' +
		'<th style="width:100px">Duration</th>' +		
		'<th style="width:50px">Status</th>' +
	'</tr>' +
	'</thead>' +
	'<tbody>';

	var footer =  '</tbody>' +
	'</table>';

	var body = '';
	
	for ( var item in this.collection ) {
		body += this.make(this.collection[item]);
	}
	
	//inboundCalls, totalCalls, inboundDuration, totalDuration
	var inboundCalls = this.attributes[0];
	var totalCalls = this.attributes[1];
	
	var inboundDuration = this.attributes[2];
	var totalDuration = this.attributes[3];
	
	var total = '<tr><td></td><td></td>'+
		'<td><strong>' + totalCalls + '(' + inboundCalls  + ')' + '</strong></td>' +
		'<td><strong>' + totalDuration + '(' + inboundDuration  + ')' + '</strong></td>' + '<td></td>'
		'</tr>'
	
	var html = header + body + total +  footer;
	
	document.getElementById(element).innerHTML = html;
}

Telzio.Controller = function() {
	return this;
}

Telzio.Controller.prototype.render = function(elementId, fromDate, toDate) {

	var instance = this;
	
	var logCollection = new Telzio.LogCollection([]);
	
	this.liveCollection = new Telzio.LiveCollection([]);
	this.logCollection = new Telzio.LogCollection([]);
	
	this.liveCollection.make(function(collection) {
		instance.liveCollection = collection;
	});
	
	var offset = 0;
	
	var instance = this;

	instance.logCollection.response = [];

	// create a collection
	logCollection.make(fromDate, toDate, offset, function(collection) {

		if (collection.data.length > 0) {

			for (var i in collection.data) {
				instance.logCollection.data.push(collection.data[i]);
			}
		}

		//setTimeout(function() {
			
			var collection = new Telzio.Statistics.make(instance.logCollection, instance.liveCollection);
			
			var inboundCalls = instance.logCollection.inboundForAll().length;
			var totalCalls = inboundCalls + instance.logCollection.outboundForAll().length;
			
			var inboundDuration =  instance.logCollection.inboundDurationForAll();
			var totalDuration =  instance.logCollection.durationForAll();
			
			var view = new Telzio.View(collection, [inboundCalls, totalCalls, inboundDuration.toHHMMSS(), totalDuration.toHHMMSS()]);
			
			view.render(elementId);
			
		//}, 1);
	});


}


