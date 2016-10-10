module.exports = (options) => {
	var express = require('express');
	var router = express.Router();
	var config = options.config;

	var mongoose = require('mongoose');
	var Schema = mongoose.Schema;

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
			// console.log('err = ' + err+ ', doc = ' + doc);
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

	router.get('/presentation/lock/:id',
		isLoggedIn,
		isAdmin,
		function(req,res,next) {
			var Presentation = req.db.Presentation;
			console.log('id = ' + req.params.id);
			Presentation.findById(req.params.id, function(err,o) {
				if (err)
					res.json({"error": err });
				else {
					if (! o.prop)
						o.prop = {};
					o.prop['lock'] = true;
					o.markModified('prop.lock');
					o.save(function(err,saved) {
						if (err)
							res.json({ "error": err });
						else
						res.json({'ok': 1});
					});
				}
			});
		}
	);

	router.get('/presentation/unlock/:id',
		isLoggedIn,
		isAdmin,
		function(req,res,next) {
			var Presentation = req.db.Presentation;
			console.log('id = ' + req.params.id);
			Presentation.findById(req.params.id, function(err,o) {
				if (err)
					res.json({"error": err });
				else {
					if (! o.prop)
						o.prop = {};
					o.prop['lock'] = false;
					o.markModified('prop.lock');
					o.save(function(err,saved) {
						if (err)
							res.json({ "error": err });
						else
						res.json({'ok': 1});
					});
				}
			});
		}
	);

	router.get('/user/lock/:id',
		isLoggedIn,
		isAdmin,
		function(req,res,next) {
			var User = req.db.User;
			User.findById(req.params.id, function(err,o) {
				if (err)
					res.json({"error": err });
				else {
					if (! o.prop)
						o.prop = {};
					o.prop['lock'] = true;
					o.markModified('prop.lock');
					o.save(function(err,saved) {
						if (err)
							res.json({ "error": err });
						else
						res.json({'ok': 1});
					});
				}
			});
		}
	);

	router.get('/user/unlock/:id',
		isLoggedIn,
		isAdmin,
		function(req,res,next) {
			var User = req.db.User;
			User.findById(req.params.id, function(err,o) {
				if (err)
					res.json({"error": err });
				else {
					if (! o.prop)
						o.prop = {};
					o.prop['lock'] = false;
					o.markModified('prop.lock');
					o.save(function(err,saved) {
						if (err)
							res.json({ "error": err });
						else
						res.json({'ok': 1});
					});
				}
			});
		}
	);

	router.post('/user/update',
		isLoggedIn,
		isAdmin,
		function(req,res,next) {
			var User = req.db.User;
			if (req.body['_id']) {
				User.findById(req.body['_id'], function(err,o) {
					if (err)
						res.json({"error": err });
					else {
						o.email = req.body.email || '';
						o.fullname = req.body.fullname || '';
						o.save(function(err,saved) {
							if (err)
								res.json({"error": err});
							else
								res.json({"ok": 1});
						});
					}
				});
			}
		}
	);
	router.get('/user/activate/:uid',
		isLoggedIn,
		isAdmin,
		function(req,res,next) {
			var User = req.db.User;
			User.findById(req.params.uid, function(err,u) {
				if (err)
					res.json({"error": err });
				else {
					console.log(u);
					if (! u.prop)
						u.prop = {};
					u.prop.authenticated = true;
					u.markModified('prop');
					u.save(function(err,savedu) {
						if (err)
							res.json({ 'error': err });
						else 
							res.json({ 'ok': 1 });
					});
				}
			});
		}
	);

	router.get('/presentation/active/:id',
		isLoggedIn,
		isAdmin,
		function(req,res,next) {
			var Presentation = req.db.Presentation, Bingo= req.db.Bingo, Audit = req.db.Audit;

			Presentation.findById(req.params.id)
				.populate({
					'path': 'bingo',
					'populate': {
						'path': 'audit'
					}
				})
				.exec(function(err,p) {
					if (err) { 
						res.json({'error': err })
					} else if (! p) {
						res.json({'error': 'Presentation not found'})
					} else {
						var foo = 0;
						if (p.prop && p.prop.active && p.prop.active.id) {
							for (var n = 0; n < p.bingo.length; ++n) {
								if (p.prop.active.id == p.bingo[n]._id) {
									for (var m = 0; m < p.bingo[n].audit.length; ++m) {
										if (p.bingo[n].audit[m].key == 'GAMESTART' && new Date(p.bingo[n].audit[m].timestamp).getTime() >= new Date(p.prop.active.start).getTime())
											++foo;
									}
								}
							}
						}
						res.json({'count': foo});
					}
				});
		}
	);

	return router;
};