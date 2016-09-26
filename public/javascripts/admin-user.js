$(document).ready(function() {
	$('#usertable').DataTable({
		'serverSide': true,
		'ajax': { 'url': '/api/user/list', type: 'POST' },
		'columns': [
			{ 
				'searchable': true,
				'data': function(row,type,val,meta) {
					// console.log('type = ' + type);
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
				data: function(row,type,val,meta) { console.log(row); return 'Presentations will go here'; }
			},
			{
				'orderable': false,
				data: function(row,type,val,meta) { return 'Admin links will go here'; }
			}
		] 
	});
});