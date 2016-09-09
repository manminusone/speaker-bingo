
var lastTimestamp = 0, changedVals = new Map();

function sendChangedVals() {
	if (changedVals.size > 0) {
		console.log('-- would send content here.');
		console.log(JSON.stringify(changedVals));
		console.log('-- ');
		changedVals = new Map();
	}
}

$(document).ready(function() {
	$('.bingoCell').click(function() {
	  if ($(this).hasClass('bingoCellOn')) {
	    $(this).removeClass('bingoCellOn');
	    $(this).addClass('bingoCellOff');
	  } else {
	    $(this).removeClass('bingoCellOff');
	    $(this).addClass('bingoCellOn');
	  }
	});
});