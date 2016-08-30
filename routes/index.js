
// admin site routes

module.exports = (options) => {

	var express = require('express');
	var router = express.Router();
	var db = options.db;
	var config = options.config;

	/* GET home page. */
	router.get('/', function(req, res, next) {
	  res.render('index', { title: 'Express', config: config });
	});


	// sign in
	router.get('/signup', function(req,res,next) {
		res.render('signup', { message: '', domain: config.vhost.uriDomain, config: config });
	});
	router.post('/signup', function(req,res,next) {
		db.presentation.findByUriNoPwd(req.body.uri, function(err,doc) {
			if (doc)
				res.render('signup', { message: 'URI already exists', domain: config.vhost.uriDomain, uri: req.body.uri, email: req.body.email, config: config });
			else
				db.presentation.save({ uri: req.body.uri, contactEmail: req.body.email, pwd: req.body.pwd }, function(err,product,numAffected) {
					console.log('save. err = ' + err + ', num affected = ' + numAffected);
					if (err) {
						res.render('signup', { message: err, config: config });
					} else {
						req.session.presentationId = product._id;
						req.session.bingoId = Array();
						res.redirect('/overview');
					}
				});
		})
	});

	// log in
	router.get('/login', function(req,res,next) {
		res.render('login', { title: 'Login', message: '', config: config });
	});
	router.get('/logout', function(req,res,next) {
		req.session.destroy(function() { res.redirect('/'); });
	})
	router.post('/login', function(req,res,next) {
		db.presentation.findByUri(req.body.uri,req.body.pwd, function(doc) {
			console.log('doc = '+JSON.stringify(doc));
			if (doc.error)
				res.render('login', { title: 'Login', message: doc.error, config: config });
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
							res.render('overview', { title: 'Overview', presentation: doc, bingos: bingos, mobileDomain: config.vhost.uriDomain, mobilePort: config.port, config: config });
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
			res.render('bingo-new', { title: 'New Bingo Session', config: config });
		else
			res.redirect('/login');	
	});

	router.post('/bingo/save', function(req,res,next) {
		if (req.session.presentationId) { // logged in
			console.log('yay, logged in');
			console.log('-- choices = ' + req.body.choices);
			var choices = JSON.parse(req.body.choices);
			console.log('-- parsed choices = ' + choices);
			var b = null;
			if (req.body.bingoId) {
				console.log('saving existing');
				db.bingo.save({
					id: req.body.bingoId,
					title: req.body.bingoTitle,
					choices: choices
				}, function(err,raw) {
					console.log('at this point, title = ' + req.body.bingoTitle);
					res.render('bingo-edit', { message: (err || 'Saved successfully'), bingoId: req.body.bingoId, bingoTitle: req.body.bingoTitle, choices: choices, config: config });
				});
			} else {
				console.log('no existing id, creating new');
				db.bingo.save({
					presentationId: req.session.presentationId,
					title: req.body.bingoTitle,
					choices: choices
				}, function(err, newdoc) {
					req.session.bingoId.push(newdoc._id);
					console.log('at this point (2), title = ' + newdoc.title);
					res.render('bingo-edit', { message: (err || 'Saved successfully'), bingoId: newdoc._id, bingoTitle: newdoc.title, choices: newdoc.choices, config: config });
				});
			}
		} else
			res.redirect('/login');
	});

	router.get('/bingo/edit/:num', function(req,res,next) {
		if (req.session.presentationId) {
			if (req.params.num >= 0 && req.params.num < req.session.bingoId.length) {
				console.log('looking for ' + req.session.bingoId[req.params.num]);
				db.bingo.findById(req.session.bingoId[req.params.num], function(err,thisbingo) {
					if (! err && thisbingo) {
						res.render('bingo-edit', { bingoId: thisbingo._id, bingoTitle: thisbingo.title, choices: thisbingo.choices, config: config });
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


//	static pages
	router.get('/static/about', function(req,res,next) {
		res.render('about', { title: 'About this site', tabChoice: 'about', config: config});
	});
	router.get('/static/tos', function(req,res,next) {
		res.render('tos', { title: 'Terms of service', tabChoice: 'tos', config: config});
	});
	router.get('/static/contact', function(req,res,next) {
		res.render('contact', { title: 'Contact us', tabChoice: 'contact', config: config});
	});
	router.post('/static/contact', function(req,res,next) {
		res.mailer.send('email-contact', {
			to: config.contactAddress,
			subject: '[Speaker Bingo] ' + req.body.subject,
			name: req.body.name,
			email: req.body.email,
			rawSubject: req.body.subject,
			message: req.body.message
		}, function(err) {
			if (err) { console.log('err when sending email: ' + err); }
			res.render('contact-thanks', { title: 'Contact us', tabChoice: 'contact', config: config });
		});
	})

	return router;
};