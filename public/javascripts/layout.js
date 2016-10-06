// for general purpose functions

function nicerDate(dateObj) {
	var ret =
	  ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dateObj.getMonth()] +
	  ' ' +
	  dateObj.getDate() +
	  ', ' +
	  dateObj.getHours() + 
	  ':' +
	  ('00'+dateObj.getMinutes()).substr(-2,2)
	;
	return ret;
}

$(function() {
	$('date.niceDate').each(function() {
		var d = new Date(this.innerText);
		if (d)
			this.innerText = nicerDate(d);
		else 
			console.log('could not process '+this.innerText);
	});	

	if ($('#contactTable')) {
		console.log('setting change()')
		$(document).keypress(function() {
			if ($('#name').val() == '' || $('#email').val() == '' || $('#message').val() == '') {
				$('#smailButton').attr('disabled','disabled');
			}
			else {
				$('#smailButton').removeAttr('disabled');
			}
		});
	}
});