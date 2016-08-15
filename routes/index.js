
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
		res.render('signup', { });
	});
	router.post('/signup', function(req,res,next) {
		var p = db.newPresentation(req.body.uri, req.body.email, req.body.pwd);
		res.render('overview', { doc: p, bingos: [] });
	});

	// log in
	router.get('/login', function(req,res,next) {
		res.render('login', { title: 'Login', message: '' });
	});
	router.post('/login', 
		function(req,res,next) {
		db.findPresentation(req.body.ident, req.body.pwd, function(doc) {
			console.log(doc);
			if (doc.error)
				res.render('login', { title: 'Login', message: doc.error });
			else {
				req.session.doc = doc;
				db.findBingos(doc._id, function(bingos) {

					req.session.bingos = bingos;
					bingos.forEach(function(i) {
						console.log('-- i = ' + i);
						console.log('-- i.save = ' + i.save);
					});
					res.redirect('/overview');

				});
			}
		});
	});

	router.get('/overview', function(req,res,next) {
		if (req.session.doc) 
			res.render('overview', { doc: req.session.doc, bingos: req.session.bingos })
		else
			res.redirect('/login');
	});

	// bingo routes
	router.get('/bingo/new', function(req,res,next) {
		if (req.session.doc)
			res.render('bingo-new', { });
		else
			res.redirect('/login');	
	});

	router.post('/bingo/save', function(req,res,next) {
		if (req.session.doc) {
			var choices = req.body.bingos.split(/[\n\r]+/);
			var b = null;
			if (req.body.bingoId) {
				req.session.bingos.forEach(function(i) {
					console.log(i._id + ' <=> ' + req.body.bingoId);
					if (i._id == req.body.bingoId) {
						b = i;
					}
				})
			} else {
				b = db.newBingo(req.session.doc._id);
			}

			if (b != null) {
				console.log('-- at this point, b = ' + b);
				b.title = req.body.bingoTitle;
				b.choices = choices;
				db.saveBingo(b,function(err,bdoc,numAffected) {
					console.log('-- doc = ' + bdoc);
					console.log('-- numAffected = ' + numAffected);
					if (err) {
						res.render('bingo-new', { message: err });
					} else {
						if (req.session.bingos) {
							var didit = false;
							console.log(req.session.bingos);
							console.log(bdoc);
							for (var i = 0; i < req.session.bingos.length; ++i) {
								console.log(req.session.bingos[i]._id + ' <=> ' + bdoc._id);
								if (req.session.bingos[i]._id == bdoc._id) {
									console.log('did it!');
									req.session.bingos[i] = bdoc;
									didit = true;
								}
							}
							if (! didit) {
								console.log('didnt do it');
								req.session.bingos.push(bdoc);
							}
						}
						else {
							req.session.bingos = Array(bdoc);
						}

						res.render('bingo-edit', { message: 'Saved successfully', id: bdoc._id, bingoTitle: bdoc.title, choices: bdoc.choices.join("\n") });
					}
				});
			}
		} else
			res.redirect('/login');
	});

	router.get('/bingo/edit/:num', function(req,res,next) {
		if (req.session.doc) {
			if (req.params.num >= 0 && req.params.num < req.session.bingos.length) {
				var thisdoc = req.session.bingos[req.params.num];
				console.log(JSON.stringify(thisdoc));
				res.render('bingo-edit', { message: '', bingoId: thisdoc._id, bingoTitle: thisdoc.title,
					choices: thisdoc.choices.join("\n") });
			} else
			res.redirect('/overview');
		} else
			res.redirect('/login');
	});
	return router;
};