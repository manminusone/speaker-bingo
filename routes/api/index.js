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
	router.get('/user/list/:start', 
		isLoggedIn,
		isAdmin,
		function(req,res,next) {
			var User = req.db.User;

			User.count({}, function(err,numusers) {
				if (! err) {
					var pagesize = 0;
					if (numusers < 1000)
						pagesize = numusers;
					else if (numusers < 10000)
						pagesize = 1000;
					else if (numusers < 100000)
						pagesize = 2000;
					else
						pagesize = 1000;
					User.find({})
					 .select('_id email prop presentation audit')
					 .skip(req.params.start)
					 .limit(pagesize)
					 .populate({path: 'presentation', populate: { path: 'bingo', populate: 'audit' }})
					 .populate({path: 'presentation', populate: 'audit' })
					 .exec(function(err,result) {
						res.json(result);
					})
				}
			});
		}
	);
	return router;
};