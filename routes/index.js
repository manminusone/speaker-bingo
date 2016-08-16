
module.exports = (options) => {

	var express = require('express');
	var router = express.Router();
	var db = options.db;

	/* GET home page. */
	router.get('/', function(req, res, next) {
	  res.render('index', { title: 'Express' });
	});


	// sign in
	router.get('/signup', function(req,res,next) {
		res.render('signup', { message: '' });
	});
	router.post('/signup', function(req,res,next) {

		db.presentation.save({ uri: req.body.uri, contactEmail: req.body.email, pwd: req.body.pwd }, function(err,product,numAffected) {
			console.log('save()');
			if (err) {
				res.render('signup', { message: err });
			} else {
				req.session.presentationId = product._id;
				req.session.bingoId = Array();
				res.redirect('/overview');
			}
		});
	});

	// log in
	router.get('/login', function(req,res,next) {
		res.render('login', { title: 'Login', message: '' });
	});
	router.post('/login', function(req,res,next) {
		db.presentation.findByUri(req.body.uri,req.body.pwd, function(doc) {
			if (doc.error)
				res.render('login', { title: 'Login', message: doc.error });				
			else {
				req.session.presentationId = doc._id;
				db.bingo.findByPresentationId(doc._id, function(err,bingos) {
					var tmp = Array();
					if (! err && bingos)
						bingos.forEach(function(o) { tmp.push(o._id); });
					req.session.bingoId = tmp;
					res.redirect('/overview');
				});
			}
		});
	});

	router.get('/overview', function(req,res,next) {
		if (req.session.presentationId) {
			db.presentation.findById(req.session.presentationId, function(err,doc) {
				if (! err && doc) {
					db.bingo.findByIds(req.session.bingoId, function(err,bingos) {
						if (! err && bingos)
							res.render('overview', { presentation: doc, bingos: bingos });
						else 
							res.redirect('/login');
					});
				} else
					res.redirect('/login');
			});
		} 
		else
			res.redirect('/login');
	});

	// bingo routes
	router.get('/bingo/new', function(req,res,next) {
		if (req.session.presentationId)
			res.render('bingo-new', { });
		else
			res.redirect('/login');	
	});

	router.post('/bingo/save', function(req,res,next) {
		if (req.session.presentationId) {
			var choices = req.body.choices.split(/[\n\r]+/);
			var b = null;
			if (req.body.bingoId) {
				db.bingo.save({
					_id:  req.body.bingoId,
					title: req.body.bingoTitle,
					choices: choices
				}, function(err) {
					console.log('at this point, title = ' + req.body.bingoTitle);
					res.render('bingo-edit', { message: (err || 'Saved successfully'), bingoId: req.body.bingoId, bingoTitle: req.body.bingoTitle, choices: choices.join("\n") });
				});
			} else {
				db.bingo.save({
					presentationId: req.session.presentationId,
					title: req.body.bingoTitle,
					choices: choices
				}, function(err, newdoc) {
					req.session.bingoId.push(newdoc._id);
					console.log('at this point (2), title = ' + req.body.bingoTitle);
					res.render('bingo-edit', { message: (err || 'Saved successfully'), bingoId: req.body.bingoId, bingoTitle: req.body.bingoTitle, choices: choices.join("\n") });
				});
			}
		} else
			res.redirect('/login');
	});

	router.get('/bingo/edit/:num', function(req,res,next) {
		if (req.session.presentationId) {
			if (req.params.num >= 0 && req.params.num < req.session.bingoId.length) {
				db.bingo.findById(req.session.bingoId[req.params.num], function(err,thisbingo) {
					if (! err && thisbingo) {
						res.render('bingo-edit', { bingoId: thisbingo._id, bingoTitle: thisbingo.title, choices: thisbingo.choices.join("\n") });
					} else
					res.redirect('/overview');
				})
			} else
			res.redirect('/overview');
		} else
			res.redirect('/login');
	});
	router.get('/bingo/test/:num', function(req,res,next) {
		if (req.session.presentationId) {
			if (req.params.num >= 0 && req.params.num < req.session.bingoId.length) {
				console.log('- attempting to set ' + req.session.presentationId + ',' + req.session.bingoId[req.params.num]);
				db.presentation.save({ _id: req.session.presentationId, testBingoId: req.session.bingoId[req.params.num] }, function(err) {
					res.redirect('/overview');
				});
			} else
				res.redirect('/overview');
		} else
			res.redirect('/login');
	});
	router.get('/bingo/test-off', function(req,res,next) {
		if (req.session.presentationId) {
			db.presentation.save({ _id: req.session.presentationId, testBingoId: null }, function(err) {
				res.redirect('/overview');
			});
		} else
			res.redirect('/login');
	});


	// uris!

	router.get('/:uid', function(req,res,next) {
		var uid = req.params.uid;
		db.presentation.findByUriNoPwd(function(err,p) {
			if (err)
				res.redirect('/');

			if (p.testBingoId) {
				
			} else
				res.render('uri-default', { loggedIn: (p._id == req.session.presentationId) });
		});
	})
	return router;
};