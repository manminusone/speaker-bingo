
var tableObj,
	choiceList = Array(), 
	emailList = Array(), 
	fullnameList = Array(), 
	idList = Array();

var userauthHandler = function(e) {
	var id = e.target.dataset.id;
	console.log(e);
	if (confirm('Activate this account?')) {
		$.ajax({
			'url': '/api/user/activate/'+id
		}).done(function(response) {
			if (response.error)
				alert('Error when updating user account: ' + response.error);
			else {
				var i = e.target.dataset.row;
				console.log('invalidating row '+i);
				tableObj.row(i).invalidate().draw();
			}
		});
	}

};

var presentationLockHandler = function(e) {
	var locking = $(e.target).hasClass('fa-unlock');

	if (confirm('Confirm the ' + (locking ? 'locking': 'unlocking') + ' of this presentation')) {
		$.ajax({
			'url': '/api/presentation/'+(locking ? 'lock' : 'unlock')+'/'+e.target.dataset.id
		}).done(function(response) {
			if (response.error)
				alert('Error when updating presentation: ' + response.error);
			else {
				$('#'+e.target.dataset.id)
				 .removeClass(locking ? 'fa-unlock' : 'fa-lock')
				 .addClass(locking ? 'fa-lock' : 'fa-unlock')
				;
			}
		})
	}
}
var userLockHandler = function(e) {
	var locking = $(e.target).hasClass('fa-unlock');

	if (confirm('Confirm the ' + (locking ? 'locking': 'unlocking') + ' of this account')) {
		$.ajax({
			'url': '/api/user/'+(locking ? 'lock' : 'unlock')+'/'+e.target.dataset.id
		}).done(function(response) {
			if (response.error)
				alert('Error when updating user: ' + response.error);
			else {
				$('#'+e.target.dataset.id)
				 .removeClass(locking ? 'fa-unlock' : 'fa-lock')
				 .addClass(locking ? 'fa-lock' : 'fa-unlock')
				;
			}
		})
	}
}

$(document).ready(function() {
	tableObj = $('#usertable').DataTable({
		'serverSide': true,
		'ajax': { 'url': '/api/user/list', type: 'POST' },
		'columns': [
			{ 
				'searchable': true,
				'data': function(row,type,val,meta) {
					var authIcon = '<i class="fa fa-question-circle-o fa-address-unconfirmed" data-id="'+row._id+'" data-row="'+meta.row+'" title="Unconfirmed email address"></i>';
					if (row.prop && row.prop.authenticated)
						authIcon = '<i class="fa fa-check-circle-o fa-address-confirmed" title="Address has been confirmed"></i>';

					if (type === 'display') {
						return '<a href="mailto:'+row.email+'">'+row.email+'</a> '+authIcon;
					} else if (type === 'filter') {
						return '<a href="mailto:'+row.email+'">'+row.email+'</a> '+authIcon+' '+row.email;
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

					if (meta.row == 0) {
						choiceList = Array();
						emailList = Array();
						fullnameList = Array();
						idList = Array();
					}
					idList[meta.row] = row._id;
					emailList[meta.row] = row.email;
					fullnameList[meta.row] = row.prop.fullname;

					if (row.presentation.length == 0)
						return 'No presentations';

					var ret = '';
					for (var iter = 0; iter < row.presentation.length; ++iter) {
						ret += '<div class="admin-presentation">' +
							'<div class="pull-right"> ' +
							'<i id="'+row.presentation[iter]._id+'" class="fa ' + 
							(row.presentation[iter].prop && row.presentation[iter].prop.lock ? 'fa-lock' : 'fa-unlock') + 
							' presentation-lock" data-type="presentation" data-id="'+row.presentation[iter]._id+'"></i>' +
							' </div> ' + 
							 '<button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#hidden-'+meta.row+'-'+iter+'" aria-expanded="false" aria-controls="hidden-'+meta.row+'-'+iter+'">' + row.presentation[iter].uri + '</button> ' +
							 '<div id="hidden-'+meta.row+'-'+iter+'" class="collapse"> ';
						for (var i2 = 0; i2 < row.presentation[iter].bingo.length; ++i2) {
							ret += '<button type="button" class="btn btn-info" data-toggle="modal" data-target="#testCardModal" data-choice="' + choiceList.length + '">' + row.presentation[iter].bingo[i2].title + '</button>';
							choiceList.push(row.presentation[iter].bingo[i2].choices);
						}
						ret += '</div> </div>';
					}
					return ret;

				}
			},
			{
				'orderable': false,
				data: function(row,type,val,meta) { 
					var ret = '';
					ret = '<h2>' + 
						'<i id="' + row._id + '" class="fa ' +
						((row.prop && row.prop.lock) ? 'fa-lock' : 'fa-unlock') +
						' user-lock" data-type="user" data-id="'+row._id+'"></i> ' +
						' <i class="fa fa-user-secret user-data" data-toggle="modal" data-target="#userModal" data-id="'+row._id+'" data-choice="'+meta.row+'"></i>' +
						' <i class="fa fa-trash"></i>'
						'</h2>';

					return ret;
				}
			}
		] 
	}).on('draw.dt', function() { 
		$('i.presentation-lock').click(presentationLockHandler);
		$('i.user-lock').click(userLockHandler);
		$('i.fa-address-unconfirmed').click(userauthHandler);
	});

	$('.test-card-modal').on('show.bs.modal', function(e) {
		var tmpArray = choiceList[e.relatedTarget.attributes['data-choice'].value];
		for (var x = 1; x <= 24; ++x)
			$('#ttbl'+x).html('<div>'+tmpArray[x - 1]+'</div>');
	});
	$('.user-modal').on('show.bs.modal', function(e) {
		var i = e.relatedTarget.attributes['data-choice'].value;
		console.log(idList[i]);
		$('#userIdHidden').val(idList[i]);
		$('#userEmail').val(emailList[i]);
		$('#userFullName').val(fullnameList[i]);
		$('#update-user-info-button').click(function(e) {
			console.log('click');
			$.ajax({
				'method': 'POST',
				'url': '/api/user/update',
				'data': { '_id': $('#userIdHidden').val(), 'email': $('#userEmail').val(), 'fullname': $('#userFullName').val() }
			}).done(function(response) {
				if (response.error)
					alert('Error when updating user: '+response.error);
				else {
					console.log('invalidating row '+i);
					tableObj.row(i).invalidate().draw();
				}
			}).fail(function(response) { console.log(response)});
		});
	});
});