function addBingoItem(txtName) {
	var closeButton = $('<i class="fa fa-close bingoDel"> </i>');
	closeButton.click(function() { $(this).parent().remove() });
	var editableSpan = $('<span contenteditable="true"> ' + txtName + '</span> ');
	editableSpan.keydown(function(ev) { if (ev.which == 13) { console.log('done'); $('#bingoEntry').focus(); ev.preventDefault(); }});
	var tmp = $('<li> </li>'); tmp.append(editableSpan);
	tmp.append(closeButton);
	$('#bingoList').append(tmp);
}


$(document).ready(function() {
	console.log('setting up form');

	$('#submitButton').click(function(e) {
		var choiceArray = $('#bingoList li span');
		var result = Array();
		for (var i = 0; i < choiceArray.length; ++i) {
			result.push(choiceArray[i].innerText);
		}
		console.log(JSON.stringify(result));
		document.forms[0].choices.value = JSON.stringify(result);
		document.forms[0].submit();
	});

	$('#bingoEntry').keydown(function(ev) {
		if (ev.which == 13) {
			ev.preventDefault();
			if ($('#bingoEntry').val() != '') {
				addBingoItem($('#bingoEntry').val());
				$('#bingoEntry').val('');
			}
		}
	});
});