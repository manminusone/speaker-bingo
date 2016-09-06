
var currentPresId = '';

var saveList = [];

function updateSaveList(e) {
	var num = /(\d+)$/.exec(e.target.id)[1];
	if (!saveList[num])
		saveList[num] = {};
	saveList[num].uri = $('#presTitle'+num)[0].innerText;
	if (!saveList[num].bingo)
		saveList[num].bingo = [];
	for (var iter = 1; iter < $('#presContent'+num+' ul.bingoList').length; ++iter) {
		if (! saveList[num].bingo[iter])
			saveList[num].bingo[iter] = {};
		saveList[num].bingo[iter].title = $('#presContent'+num+' ul.bingoList #bingoTitle'+iter).innerText;
	}
}

function enableSave(evt) {
	console.log(evt.target.id);
	if (evt.target.id.substr(0,9) == 'presTitle') { // changed the uri
		console.log('*** changed title');
	} else if (evt.target.id.substr(0,7) == 'clickMe') { // added an item to the list
		console.log('*** added list item');
	}
	var num = /(\d+)$/.exec(evt.target.id)[1];
	$('#save'+num).click(function(e) { doSave(e);  });

	$('#save'+num).removeClass('fa-disabled');
}

function doSave(e) {
	console.log('- doSave');
	console.log('- ' + e.target.id);
	var num = /(\d+)$/.exec(e.target.id);
}

var checkUriFn = function(currentVal,uriIndicator) {
 		if (currentVal == '')
 			uriIndicator.removeClass('label-success label-danger')
 				.addClass('label-default')
 				.text('Waiting');
 		else
		$.getJSON('/api/uri/'+currentVal, function(data) {
			console.log('- data = ' + JSON.stringify(data));
			if (data.exists)
				uriIndicator.removeClass('label-default label-success')
					.addClass('label-danger')
					.text('Exists');
			else
				uriIndicator.removeClass('label-default label-danger')
					.addClass('label-success')
					.text('Available');


		});
	};


$(document).ready(function() {
	$('#accordionBingo').accordion();
	$('#ovPres').accordion();
	$('#newPresentationButton').click(function(e) {
		var numItems = $('#ovPres > h3').length + 1;

		var newPres = '<h3>  /<span class="presName" contenteditable="true" id="presTitle'+numItems+'" name="presTitle'+numItems+'">title</span> <span id="indicator'+numItems+'" name="indicator'+numItems+'" class="label label-default"> Waiting </span> <span class="pull-right"><i class="fa fa-save fa-disabled" id="save'+numItems+'" name="save'+numItems+'"></i></span> </h3> <div id="presContent'+numItems+'" name="presContent'+numItems+'">  <div class="col-md-8"><ul class="bingoList"> <li class="clickMe" id="clickMe'+numItems+'" name="clickMe'+numItems+'" value=""> click to add items </li> </ul></div> <div class="col-md-4"> </div> </div>';
		$('#ovPres').append(newPres).accordion('refresh');
		$('#presTitle'+numItems).keydown(function(e) {
			enableSave(e);
			if (e.which == 32)
				e.preventDefault();
			checkUriFn(this.innerText, $('#indicator'));
		}).focus();

		$('ul.bingoList > li.clickMe').click(function(e) { 
			var numItems = this.parentNode.childElementCount;
			$('ul.bingoList').prepend('<li> <span class="bingoName" contentEditable="true" id="bingoTitle'+numItems+'" name="bingoTitle'+numItems+'"> title </span>  <small>0 items</small> <span class="pull-right"><i class="fa fa-pencil-square-o editIcon"> </i> <i class="fa fa-circle activeIcon"> </i> <i class="fa fa-times-circle delIcon"> </i> </span> </li>')
			enableSave(e);
		 });
	});
	$(document).keypress(function(e) { console.log(e.which); if (e.which == 115) e.preventDefault(); });
});