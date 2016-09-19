
// admin site routes

module.exports = (options) => {
	var config = options.config;
	var mailer = options.mailer;
	var log = options.log;

	var express = require('express');
	var gravatar = require('gravatar');
	var bcrypt = require('bcrypt');
	var md5 = require('md5');

	var router = express.Router();

	var isLoggedIn = function(req,res,next) {
		var User = req.db.User;
		if (req.session.userId) {
			User.findById(req.session.userId).populate({ path: 'presentation', populate { path: 'bingo', populate: 'audit'}}).exec(function(err,u) {
				if (u) req.session.user = u;
				next();
			});
		} else
			res.redirect('/login');
	};

	// home page
	router.get('/', function(req, res, next) {
		var User = req.db.User;
		if (req.session.userId)			
			User.findById(req.session.userId, function(err,u) {
				res.render('index', { title: 'Speaker Bingo', config: config, user: u });
			})
		else
			res.render('index', { title: 'Speaker Bingo', config: config });
	});


	// sign in
	router.get('/signup', function(req,res,next) {
		if (req.session.userId)
			res.redirect('/profile');
		else
			res.render('user-signup', { tabChoice: 'account', title: 'Sign up', message: '', config: config });
	});
	router.post('/signup', function(req,res,next) {
		var User = req.db.User;

		User.findOne({ email: req.body.email }).exec(function(err,userRec) {
			if (userRec)
				res.render('user-signup', { title: 'Sign up', message: 'Email already exists', email: req.body.email, config: config });
			else {
				var millis = new Date().getMilliseconds();
				var u = new User({ email: req.body.email, prop: { 'authenticated': false, 'admin': false, 'authHash': md5(req.body.email + ' '+millis.toString()) } });
				bcrypt.hash(req.body.pwd, 10, function(err,hash) {
					if (hash) {
						u.hash = hash;
						u.save(function(err,updatedUser,numAffected) {
							if (err) {
								res.render('user-signup', { tabChoice: 'account', title: 'Sign up', message: err, email: req.body.email, config: config });
							} else {
								mailer.send('email/activation',
									{
										'to': updatedUser.email,
										'from': config.mailer.from,
										'subject': 'Speaker Bingo - activation',
										'hash': updatedUser.prop.authHash,
										'siteUrl': (config.port == 443 ? 'https://' : 'http://') + config.vhost.adminDomain + (config.port != 443 & config.port != 80 ? ':' + config.port : '') 
									},
									function(err) {
										if (err) {
											log.info(err);
											res.render('message', { 'tabChoice': 'account', 'config': config, 'title': 'Account created', 'message': 'Your account was created, but your authentication email may have failed to be sent. If you do not receive the authtorization email, please click on the re-send link on the login page. Thanks!'})
										}
										res.render('message', { 'tabChoice': 'account', 'config': config, 'title': 'Account created', 'message': "Thank you for signing up. Check your email for an authentication message." });
									}
								);
							}
						});						
					}
				});

			}
		});
	});

	router.get('/activation', 
		isLoggedIn,
		function(req,res,next) {
			var User = req.db.User;
			if (req.session.userId)
				User.findById(req.session.userId).exec(function(err,product) {
					if (product) {
						var millis = new Date().getMilliseconds();
						product.prop.authHash = md5(product.email + ' ' + millis.toString());
						product.markModified('prop');
						product.save(function(err) {
							mailer.send('email/activation',
								{
									'to': product.email,
									'from': config.mailer.from,
									'subject': 'Speaker Bingo - activation',
									'activation': ac,
									'siteUrl': (config.port == 443 ? 'https://' : 'http://') + config.vhost.adminDomain + (config.port != 443 & config.port != 80 ? ':' + config.port : '') 
								},
								function(err) {
									if (err) {
										log.info(err);
										res.render('message', { 'tabChoice': 'account', 'config': config, 'title': 'Account created', 'message': 'Your account was created, but your authentication email may have failed to be sent. If you do not receive the authtorization email, please click on the re-send link on the login page. Thanks!'})
									}
									res.render('message', { 'tabChoice': account, 'config': config, 'title': 'Account created', 'message': "Thank you for signing up. Check your email for an authentication message." });
								}
							);
						});
					} else
						res.redirect('/');
				});
		else
			res.redirect('/');
		
	});
	router.get('/activate', function(req,res,next) {
		var User = req.db.user;
		if (req.query.q) {
			User.findOne({ 'prop.authHash': req.query.q}).exec(function(err,u) {
				if (u) {
					u.prop.authHash = null;
					u.prop.authenticated = true;
					u.markModified('prop');
					u.save(function(err,newU) {
						res.render('message', { 'tabChoice': 'account', 'config': config, 'title': (err ? err : 'Success'), 'message' : (err ? 'This operation did not work: ' + err : 'You are good to go! Head over to the login page.') });
					})
				}
			})
		}
	});

	// log in/out
	router.get('/login', function(req,res,next) {
		res.render('user-login', { tabChoice: 'account', title: 'Login', message: '', config: config });
	});
	router.get('/logout', function(req,res,next) {
		req.session.destroy(function() { res.redirect('/'); });
	})
	router.post('/login', function(req,res,next) {
		var User = req.db.User;
		User.findOne({ 'email': req.body.email}).exec(function(err,doc) {
			if (doc) 
				bcrypt.compare(req.body.pwd, doc.hash, function(err,res) {
					if (res) {
						req.session.userId = doc._id;
						res.redirect('/profile');
					} else
						res.render('user-login', {  'tabChoice': 'account', title: 'Login', message: err || 'Account not found', config: config, email: req.body.email });
				});
		});
	});

	router.get('/profile', 
		isLoggedIn,
		function(req,res,next) {
			console.log('--> ' + JSON.stringify(req.session.user));
			res.render('user-profile', { 'tabChoice': 'profile', config: config, user: req.session.user, gravatar: gravatar.url(req.session.user.email) });
		}
	);

	router.post('/presentation/new', 
		isLoggedIn,
		function(req,res,next) {
			var Presentation = req.db.Presentation;

			Presentation.find({ uri: req.body.uri }).exec(function(err,doc) {
				if (doc) {
					res.render('uri-exists', { 'title': 'New presentation', 'message': 'Your choice fora URI already exists. Try again', 'user': req.session.user });
				} else {
					var p = Presentation.new({ uri: req.body.uri });
					p.save(function(err,newP) {
						req.session.user.presentation.push(newP);
						req.session.user.save(function(err,savedUser) {
							res.redirect('/profile');
						});
					});
				}
			});
		}
	);


	// bingo routes

	router.get('/bingo/:num/new',
		isLoggedIn,
		function(req,res,next) {
			res.render('bingo-new', { 'title': 'New Bingo Card', 'config': config, 'presentationNum': req.params.num, 'user': req.session.user });
		});

	router.post('/bingo/save', 
		isLoggedIn,
		function(req,res,next) {

			var choices = JSON.parse(req.body.choices);
			var pid = req.body.presentationNum;
			var u = req.session.user;
			var Bingo = req.db.Bingo;
			req.session.user = null;

			if(req.body.bingoId) {
				Bingo.findById(req.body.bingoId, function(err,doc) {
					doc.title = req.body.bingoTitle;
					doc.choices = choices;
					doc.save(function(err,savedBingo) {
						res.render('bingo-edit', { 
							message: (err || 'Saved successfully'), 
							user: u,
							bingo: savedBingo,
							config: config });
					});
				});
			} else {
				doclib.bingo.save({
					presentationId: u.presentations[pid]._id,
					title: req.body.bingoTitle,
					choices: choices
				}, function(err,newBingo) {
					u.presentations[pid].bingos.push(newBingo._id);
					doclib.presentation.save(u.presentations[pid], function(err,newdoc,numSaved) {
						res.render('bingo-edit', {
							message: (err || 'Saved successfully'),
							user: u,
							bingo: newBingo,
							config: config
						});
					});
				});

			} // else
		} // middleware function
	); // post()

	router.get('/bingo/edit',
		userlib.isAuthenticated,
		function(req,res,next) {
			if (req.query.q) {
				var u = req.session.user;
				var rendered = 0;
				for (var i = 0; i < u.presentations.length; ++i)
					for (var j = 0; j < u.presentations[i].bingos.length; ++j) {
						if (u.presentations[i].bingos[j]._id == req.query.q) {
							res.render('bingo-edit', {
								message: '',
								user: u,
								bingo: u.presentations[i].bingos[j],
								config: config
							});
							rendered = 1;
							break;
						}
					}
				if (! rendered)
					res.render('message', { message: "You tried to edit a nonexistent bingo card.", user: u });
			} else
				res.redirect('/');
		});

	router.get('/bingo/test', 
		userlib.isAuthenticated,
		function(req,res,next) {
			var u = req.session.user;
			if (req.query.q) {
				var rendered = 0;
				for (var i = 0; i < u.presentations.length; ++i)
					for (var j = 0; j < u.presentations[i].bingos.length; ++j) {
						if (u.presentations[i].bingos[j]._id == req.query.q) {
							u.presentations[i].testBingoId = u.presentations[i].bingos[j]._id;
							doclib.presentation.save(u.presentations[i], function() { res.redirect('/profile') });
							rendered = 1;
							break;
						}
					}
				if (! rendered)
					res.render('message', { message: "You tried to access a nonexistent bingo card.", 'user': u });
			} else
				res.redirect('/');
		}
	);

	router.get('/bingo/activate', 
		userlib.isAuthenticated,
		function(req,res,next) {
			var u = req.session.user;			
			if (req.query.q) {
				var rendered = 0;
				for (var i = 0; i < u.presentations.length; ++i)
					for (var j = 0; i < u.presentations[i].bingos.length; ++j) {
						if (u.presentations[i].bingos[j].id == req.query.q) {
							u.presentations[i].activeBingoId = u.presentations[i].bingos[j]._id;
							doclib.presentation.save(u.presentations[i], function() { res.redirect('/profile'); });
							rendered = 1;
							break;
						}
					}
				if (! rendered) 
					res.render('message', { message: "You tried to access a nonexistent bingo card.", 'user': u });
			} else
				res.redirect('/');
		}
	);


//	static pages
	router.get('/static/about', function(req,res,next) {
		if (req.session.userId && ! req.session.user)
			userlib.find({ 'id': req.session.userId }, function(err,u) {
				req.session.user = u;
				res.render('about', { title: 'About this site', tabChoice: 'about', config: config, 'user': u });
			})
		else
			res.render('about', { title: 'About this site', tabChoice: 'about', config: config});
	});
	router.get('/static/tos', function(req,res,next) {
		if (req.session.userId && ! req.session.user)
			userlib.find({ 'id': req.session.userId }, function(err,u) {
				req.session.user = u;
				res.render('tos', { title: 'Terms of service', tabChoice: 'tos', config: config, 'user': u});
			});
		else
			res.render('tos', { title: 'Terms of service', tabChoice: 'tos', config: config, 'user': req.session.user });
	});
	router.get('/static/contact', function(req,res,next) {
		if (req.session.userId && ! req.session.user)
			userlib.find({ 'id': req.session.userId }, function(err,u) {
				req.session.user = u;
				res.render('contact', { title: 'Contact us', tabChoice: 'contact', config: config, 'user': u });
			});
		else
			res.render('contact', { title: 'Contact us', tabChoice: 'contact', config: config, 'user': req.session.user });
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
			if (err) { log.info('err when sending email: ' + err); }
			if (req.session.userId && ! req.session.user)
				userlib.find({ 'id': req.session.userId }, function(err,u) {
					req.session.user = u;
					res.render('contact-thanks', { title: 'Contact us', tabChoice: 'contact', config: config, 'user': u });
				});
			else
				res.render('contact-thanks', { title: 'Contact us', tabChoice: 'contact', config: config });
	});
	})

	return router;
};
