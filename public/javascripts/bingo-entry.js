$(document).ready(function() {
	console.log('setting up form');

	$('#submitButton').click(function(e) {
		var choiceArray = $('#bingoList li span');
		var result = '';
		for (var i = 0; i < choiceArray.length; ++i) {
			if (result != '') result += "\n";
			result += choiceArray[i].innerText;
		}
		document.forms[0].choices = result;
		document.forms[0].submit();
	});

	$('#bingoEntry').keydown(function(ev) {
		if (ev.which == 13) {
			console.log('enter');
			if ($('#bingoEntry').val() != '') {
				var closeButton = $('<i class="fa fa-close bingoDel" style="border: 1px solid #ccc; "> </i>');
				closeButton.click(function() { $(this).parent().remove() });
				var editableSpan = $('<span contenteditable="true"> ' + $('#bingoEntry').val() + '</span> ');
				editableSpan.keydown(function(ev) { if (ev.which == 13) { console.log('done'); $('#bingoEntry').focus(); ev.preventDefault(); }});
				var tmp = $('<li> </li>'); tmp.append(editableSpan);
				tmp.append(closeButton);
				$('#bingoList').append(tmp);
				$('#bingoEntry').val('');
			}
			ev.preventDefault();
		}
	});
});