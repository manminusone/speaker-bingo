module.exports = (options) => {
	var express = require('express');
	var router = express.Router();
	var config = options.config;

	var isLoggedIn = function(req,res,next) {
		var User = req.db.User;
		if (req.session.userId) {
			User.findById(req.session.userId).populate({ path: 'presentation', populate: { path: 'bingo', populate: 'audit'}}).exec(function(err,u) {
				if (u) req.session.user = u;
				next();
			});
		} else
			res.redirect('/login');
	};
	var isAdmin = function(req,res,next) {
		if (req.session.user && req.session.user.prop && req.session.user.prop['admin'])
			next();
		else
			res.redirect('/');
	};


	router.get('/uri/:uri', function(req,res,next) {
		var Presentation = req.db.Presentation;
		Presentation.findOne({ uri : req.params.uri }, function(err,doc) {
			console.log('err = ' + err+ ', doc = ' + doc);
			if (doc)
				res.json({ uri: req.params.uri, exists: true});
			else
				res.json({ uri: req.params.uri, exists: false });
		})
	});
	router.post('/user/list', 
		isLoggedIn,
		isAdmin,
		function(req,res,next) {
			console.log(req.body);

			var draw = req.body.draw, start = req.body.start, length = req.body['length'];
			var User = req.db.User;
			var conditions = {},sortby = { 'email': 1};

			if (req.body['search[value]']) {
				var rex = new RegExp(req.body['search[value]'], 'i');
				conditions['email'] = rex;
			}
			if (req.body['order[0][column]'] && req.body['order[0][dir]']) {
				var colname = Array('email','prop.created','prop.login')[req.body['order[0][column]']];
				sortby = {};
				sortby[colname]  = (req.body['order[0][dir]'] == 'asc' ? 1 : -1);
			}

			User.count({}, function(err,count) {
				User.count(conditions, function(err,filteredCount) {

					User.find(conditions)
						.select('_id email prop presentation audit')
						.skip(start)
						.limit(length)
						.sort(sortby)
						.populate({path: 'presentation', populate: { path: 'bingo' }})
						.exec(function(err,result) {
						 	var retval = {
						 		'draw': draw,
						 		'recordsTotal': count,
						 		'recordsFiltered': filteredCount,
						 		'data': result,
						 		'error': err
						 	};
						 	// console.log(JSON.stringify(retval));
							res.json(retval);
						})
					;

				})
			})
		}
	);

	return router;
};