
var choiceList = Array();

$(document).ready(function() {
	$('#usertable').DataTable({
		'serverSide': true,
		'ajax': { 'url': '/api/user/list', type: 'POST' },
		'columns': [
			{ 
				'searchable': true,
				'data': function(row,type,val,meta) {
					if (type === 'display') {
						return '<a href="mailto:'+row.email+'">'+row.email+'</a>';
					} else if (type === 'filter') {
						return '<a href="mailto:'+row.email+'">'+row.email+'</a> '+row.email;
					}
					return row.email;
				} 
			},
			{
				'searchable': false,
				'type': 'date',
				'data': function(row,type,val,meta) { 
					return nicerDate(row.prop.created ? new Date(row.prop.created) : new Date());
				}
			},
			{
				'searchable': false,
				'type': 'date',
				'data': function(row,type,val,meta) {
					return (row.prop.login ? nicerDate(new Date(row.prop.login)) : 'Never logged in');
				}
			},
			{
				'orderable': false,
				data: function(row,type,val,meta) { 

					if (meta.row == 0)
						choiceList = Array();

					if (row.presentation.length == 0)
						return 'No presentations';

					var ret = '';
					for (var iter = 0; iter < row.presentation.length; ++iter) {
						ret += '<div class="admin-presentation">' +
							'<div class="pull-right"> ' +
							(row.presentation[iter].prop && row.presentation[iter].prop.lock ? '<i class="fa fa-unlock"></i>' : '<i class="fa fa-unlock"></i>') + 
							' </div> ' + 
							 '<button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#hidden-'+meta.row+'-'+iter+'" aria-expanded="false" aria-controls="hidden-'+meta.row+'-'+iter+'">' + row.presentation[iter].uri + '</button> ' +
							 '<div id="hidden-'+meta.row+'-'+iter+'" class="collapse"> ';
						for (var i2 = 0; i2 < row.presentation[iter].bingo.length; ++i2) {
							ret += '<button type="button" class="btn btn-info" data-toggle="modal" data-target="#testCardModal" data-choice="' + choiceList.length + '">' + row.presentation[iter].bingo[i2].title + '</button>';
							choiceList.push(row.presentation[iter].bingo[i2].choices);
						}
						ret += '</div>';
					}
					return ret;

				}
			},
			{
				'orderable': false,
				data: function(row,type,val,meta) { 
					var ret = '';
					ret = '<h2>' + 
						(row.prop & row.prop.locked ? '<i class="fa fa-lock"></i>' : '<i class="fa fa-unlock"></i>') +
						' <i class="fa fa-user-secret"></i>' +
						' <i class="fa fa-trash"></i>'
						'</h2>';

					return ret;
				}
			}
		] 
	});

	$('.test-card-modal').on('show.bs.modal', function(e) {
		// console.log(e.relatedTarget.attributes['data-choice'].value);
		var tmpArray = choiceList[e.relatedTarget.attributes['data-choice'].value];
		for (var x = 1; x <= 24; ++x)
			$('#ttbl'+x).html('<p>'+tmpArray[x - 1]+'</p>');
	})
});