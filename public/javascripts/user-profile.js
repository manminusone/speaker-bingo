
var 
	goodIcon = $('<i class="fa fa-check-circle"></i> '), 
	badIcon = $('<i class="fa fa-times-circle"></i> ');

$(document).ready(function() {
	$('#newPresentationButton').click(function(e) { $('#newDiv').removeClass('hidden').addClass('show'); });
	$('#checkUriButton').click(function(e) {
		$.getJSON('/api/uri/'+$('#uri').val(), function(data) {
			if (data.exists) {
				$('#checkUriButton').removeClass('btn-default btn-success').addClass('btn-danger').html(' Check availability').prepend(badIcon);
				$('#createPresentationButton').attr('disabled','disabled');
			} else {
				$('#checkUriButton').removeClass('btn-default btn-danger').addClass('btn-success').html(' Check availability').prepend(goodIcon);
				$('#createPresentationButton').attr('disabled',null);
			}


		});
	});
	$('#createPresentationButton').click(function() { document.forms[0].submit() });

	$('.fa-turnon-icon').click(function() {
		return confirm("Confirm that you want to start this session");
	});

	$('date.niceDate').each(function() {
		var d = new Date(this.innerText);
		if (d) {
			this.innerText = 
				['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] +
				' ' +
				d.getDate() +
				', ' +
				d.getHours() + 
				':' +
				('00'+d.getMinutes()).substr(0,2)
			;
		}
	})
});