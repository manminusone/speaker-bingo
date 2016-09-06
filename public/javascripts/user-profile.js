var checkUriFn = function(currentVal,uriIndicator) {
 		if ($(this).val() == '')
 			$('#uriIndicator').removeClass('label-success label-danger')
 				.addClass('label-default')
 				.text('Waiting');
 		else
		$.getJSON('/api/uri/'+$(this).val(), function(data) {
			if (data.exists)
				$('#uriIndicator').removeClass('label-default label-success')
					.addClass('label-danger')
					.text('Exists');
			else
				$('#uriIndicator').removeClass('label-default label-danger')
					.addClass('label-success')
					.text('Available');


		});
	};


$(document).ready(function() {
	$('#accordionBingo').accordion();
	$('#ovPres').accordion();
	$('#newPresentationButton').click(function(e) {
		var numItems = $('#ovPres > h3').length + 1;

		var newPres = '<h3>  /<span contenteditable="true" id="presTitle'+numItems+'" name="presTitle'+numItems+'">title</span> </h3> <div id="presContent'+numItems+'" name="presContent'+numItems+'">  <div class="col-md-8"><ul class="bingoList"> <li class="clickMe" value=""> click to add items </li> </ul></div> <div class="col-md-4"> </div> </div>';
		$('#ovPres').append(newPres).accordion('refresh');
		$('#presTitle'+numItems).keydown(function(e) {
			console.log(this);
			if (e.which == 32)
				e.preventDefault();
			// checkUriFn(this)
		}).focus();
		$('ul.bingoList > li.clickMe').click(function(e) {  });
	});
});