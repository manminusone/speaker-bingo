var checkUriFn = function() {
	    console.log('- this = '+$(this).val());
 		if ($(this).val() == '')
 			$('#indicator').removeClass('label-success label-danger')
 				.addClass('label-default')
 				.text('Waiting');
 		else
		$.getJSON('/api/uri/'+$(this).val(), function(data) {
			if (data.exists)
				$('#indicator').removeClass('label-default label-success')
					.addClass('label-danger')
					.text('Exists');
			else
				$('#indicator').removeClass('label-default label-danger')
					.addClass('label-success')
					.text('Available');


		});
	};

$(document).ready(function() {
	$('input#uri').keyup(checkUriFn).keyup();
});