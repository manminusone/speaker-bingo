
var currentPresId = '';

var saveList = [];

function updateSaveList(e) {
}

function enableSave(spanItem) {
	var saveIcon = $(spanItem).parent().find('i.fa-save');

	saveIcon
		.click(function(e) { doSave(e);  })
		.removeClass('fa-disabled');
}

function doSave(e) {
	console.log('- doSave');
	console.log('- ' + e.target.id);
	var num = /(\d+)$/.exec(e.target.id);
}

var checkUriFn = function(spanItem) {
	var currentVal = spanItem.innerText;
	var uriIndicator = spanItem.nextSibling;

	if (currentVal == '')
		uriIndicator.removeClass('label-success label-danger')
			.addClass('label-default')
			.text('Waiting');
	else
		$.getJSON('/api/uri/'+currentVal, function(data) {
			console.log(JSON.stringify(data));
			if (data.exists)
				$(uriIndicator).removeClass('label-default label-success')
					.addClass('label-danger')
					.text('Exists');
			else
				$(uriIndicator).removeClass('label-default label-danger')
					.addClass('label-success')
					.text('Available');
		});
};

$(document).ready(function() {
	$('.presContainer:not(.template)').accordion();
	$('#newPresentationButton').click(function(e) {
		// .presContainer.template contains two children: <h3> and <div>. both of these items need to be cloned and inserted into the .presContainer
		var newh3 = $('.presContainer.template h3.containerh3.template').clone().removeClass('template'),
		    newDiv = $('.presContainer.template div.containerDiv.template').clone().removeClass('template');

		newh3.find('span.presName').keydown(function(e) { // function for uri input
			console.log('keydown');
			enableSave(this);
			if (e.which == 32)
				e.preventDefault();
			checkUriFn(this);
		}
		$('.presContainer:not(.template)').append(newh3,newDiv).accordion('refresh');
		saveList.push({ uri: '', bingo: [ ] });
		newh3.focus();

		$('ul.bingoList > li.clickMe').click(function(e) { // click for new bingo item in presentation list
			console.log(this);

			var itemNode = $('li.bingoItem.template').clone().removeClass('template');
			itemNode.find('i.editIcon').click(function(e) {  // click for edit icon in new bingo item
				var parent = this.parentNode;
				var thisNumIndex = -1;
				while (parent != null && parent.nodeName.toLowerCase() != 'div' && ! parent.classList.contains('containerDiv')) {
					if (parent.nodeName.toLowerCase() == 'li') {
						thisNumIndex = $(parent).index();
					}

					parent = parent.parentNode;
				}
				if (parent != null)
					presentationIndex = $('.containerDiv').index(parent);

				if (thisNumIndex != -1) {
					var thisForm = $(parent).find('table');
					if (! saveList[presentationIndex]) {
						saveList[presentationIndex] = { 'uri': 'title', 'bingo': [ ] };
					}
					if (! saveList[presentationIndex].bingo[thisNumIndex])


				} else console.log("couldn't find parent of "+this+'!');
			});
			$(this).parent().prepend(itemNode);

			// enableSave(e);
		 });
	});
	$(document).keypress(function(e) { if (e.which == 115) e.preventDefault(); });
});