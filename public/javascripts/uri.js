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