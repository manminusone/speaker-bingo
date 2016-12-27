
// admin site routes

module.exports = (options) => {
	var config = options.config;
	var log = config.log;

	var express = require('express');
	var gravatar = require('gravatar');
	var bcrypt = require('bcrypt');
	var md5 = require('md5');

	var router = express.Router();

	var mongoose = require('mongoose');
	var Schema = mongoose.Schema;

	var isLoggedIn = function(req,res,next) {
		log.debug('entering isLoggedIn');
		var User = req.db.User;
		if (req.session.userId) {
			User.findById(req.session.userId)
			 .populate({ 
			 	path: 'presentation', 
			 	match: { 'prop.lock': { $ne: true } },  // see admin page for unlocking
			 	populate: { 
			 		path: 'bingo'
			 	}
			 })
			 .exec(function(err,u) {
				if (u) req.session.user = u;
				next();
			});
		} else
			res.redirect('/login');			
	};

	var isLocked = function(req,res,next) {
		log.debug('entering isLocked');
		if (req.session.user && req.session.user.prop && req.session.user.prop.lock)
			res.render('message', { 'tabChoice': 'account', 'config': config, 'title': 'Account locked', 'message': 'Your account was created, but has been locked due to unusual activity. Please contact the admins for further information. Thanks.'})
		else
			next();

	};
	var isAdmin = function(req,res,next) {
		log.debug('entering isAdmin');
		if (req.session.user && req.session.user.prop && req.session.user.prop['admin'])
			next();
		else
			res.redirect('/');
	};

	// admin
	router.get('/admin', 
		isLoggedIn,
		isLocked,
		isAdmin,
		function(req,res,next) {
			res.render('admin-index', { tabChoice: 'admin', user: req.session.user, 'config': config, 'userlist': [] })
		}
	);

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
		else if (! config.allowSignup)
			res.render('message', { 'tabChoice': 'account', 'config': config, 'title': 'Account creation not allowed', 'message': 'Account creation is currently disabled by the admins. Please contact us if you want to create a new account.'});
		else
			res.render('user-signup', { tabChoice: 'account', title: 'Sign up', message: '', config: config });
	});
	router.post('/signup', function(req,res,next) {
		var User = req.db.User;

		if (! config.allowSignup)
			res.redirect('/');
		else
			User.findOne({ email: req.body.email }).exec(function(err,userRec) {
				if (userRec)
					res.render('user-signup', { title: 'Sign up', message: 'Email already exists', email: req.body.email, config: config });
				else {
					var millis = new Date().getMilliseconds();
					var u = new User({ email: req.body.email, prop: { 'created': Date.now(), 'authenticated': false, 'admin': false, 'authHash': md5(req.body.email + ' '+millis.toString()) } });
					bcrypt.hash(req.body.pwd, 10, function(err,hash) {
						if (hash) {
							u.hash = hash;
							u.save(function(err,updatedUser,numAffected) {
								if (err) {
									log.error("Error saving User record: " + err);
									res.render('user-signup', { tabChoice: 'account', title: 'Sign up', message: "Your account was not saved successfully. The admins have been alerted.", email: req.body.email, config: config });
								} else if (config.confirmByEmail) {
									req.app.mailer.send('email/activation',
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
								} else
									res.render('message', { 'tabChoice': 'account', 'config': config, 'title': 'Account created', 'message': "Thank you for signing up. The administrators will check your account and activate you soon." });
							});						
						}
					});

				}
			}); // end of User.findOne
	});

	router.get('/activation', 
		isLoggedIn,
		isLocked,
		function(req,res,next) {
			if (! config.confirmByEmail)
				res.render('message', { 'tabChoice': 'account', 'config': config, 'title': 'Account activation', 'message': 'Account activation is currently controlled by the administrators. Please drop us a line if you have any questions. Thanks!'})
			else {
				var User = req.db.User;
				if (req.session.userId)
					User.findById(req.session.userId).exec(function(err,product) {
						if (product) {
							var millis = new Date().getMilliseconds();
							product.prop.authHash = md5(product.email + ' ' + millis.toString());
							product.markModified('prop');
							product.save(function(err) {
								req.app.mailer.send('email/activation',
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
		}
	});
	router.get('/activate', function(req,res,next) {
		var User = req.db.User;
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
				bcrypt.compare(req.body.pwd, doc.hash, function(err,okay) {
					if (okay) {
						doc.prop['login'] = Date.now();
						doc.markModified('prop');
						doc.save(function(err,savedDoc) {
							req.session.userId = savedDoc._id;
							req.session.save(function() { // explicitly save req.session to confirm the userId is in memory
								res.redirect('/profile');
							});
						})
					} else
						res.render('user-login', {  'tabChoice': 'account', title: 'Login', message: 'Account not found', config: config, email: req.body.email });
				});
		});
	});

	router.get('/profile', 
		isLoggedIn,
		isLocked,
		function(req,res,next) {
			console.log(JSON.stringify(req.session.user.presentation[0]));

			res.render('user-profile', { 'tabChoice': 'profile', config: config, user: req.session.user, gravatar: gravatar.url(req.session.user.email) });
		}
	);

	router.post('/presentation/new', 
		isLoggedIn,
		isLocked,
		function(req,res,next) {
			var Presentation = req.db.Presentation;

			Presentation.findOne({ uri: req.body.uri }).exec(function(err,doc) {
				if (doc) {
					res.render('user-profile', { 'tabChoice': 'profile', config: config, message: 'Your URI choice already exists. Try again.', user: req.session.user, gravatar: gravatar.url(req.session.user.email) });
				} else {
					Presentation({ uri: req.body.uri, prop: { 'created': new Date() } })
					.save(function(err,newP) {
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
		isLocked,
		function(req,res,next) {
			res.render('bingo-new', { 'title': 'New Bingo Card', 'config': config, 'presentationNum': req.params.num, 'user': req.session.user });
		});

	router.post('/bingo/save', 
		isLoggedIn,
		isLocked,
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
					doc.save(function(err,newdoc) {
						if (err)
							log.error("Error saving existing Bingo record: " + err);
						res.render('bingo-edit', { 
							message: (err ? 'Record was not saved! The admins have been alerted.' : 'Saved successfully'), 
							user: u,
							bingo: newdoc,
							config: config });
						});
					}
				);
			} else {
				Bingo({
					'title': req.body.bingoTitle,
					'choices': choices
				}).save(function(err,newBingo) {
					if (err)
						log.error("Error saving new Bingo record: " + err);
					u.presentation[pid].bingo.push(newBingo._id);
					u.presentation[pid].save(function(err,newdoc) {
						res.render('bingo-edit', {
							message: (err ? "Record was not saved! The admins have been alerted." : 'Saved successfully'),
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
		isLoggedIn,
		isLocked,
		function(req,res,next) {
			if (req.query.q) {
				var u = req.session.user;
				var rendered = 0;
				for (var i = 0; i < u.presentation.length; ++i)
					for (var j = 0; j < u.presentation[i].bingo.length; ++j) {
						if (u.presentation[i].bingo[j]._id == req.query.q) {
							res.render('bingo-edit', {
								message: '',
								user: u,
								bingo: u.presentation[i].bingo[j],
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
		isLoggedIn,
		isLocked,
		function(req,res,next) {
			var u = req.session.user;
			var Presentation = req.db.Presentation;
			if (req.query.q) {
				var chosenId = req.query.q;
				var rendered = 0;

				for (var i = 0; i < u.presentation.length; ++i)
					for (var j = 0; j < u.presentation[i].bingo.length; ++j) {
						if (u.presentation[i].bingo[j]._id == chosenId) {
							Presentation.findById(u.presentation[i]._id, function(err, pres) {
								if (! pres.prop.test) pres.prop.test = {};
								if (! pres.prop.active) pres.prop.active = {};
								pres.prop.test.id = chosenId;
								pres.prop.active.id = null;
								pres.prop.test.start = new Date();
								pres.markModified('prop');
								pres.save(function(err,savedDoc) {
									res.redirect('/profile');
								})
							});
							rendered = 1;
							break;
						}
					}
				if (! rendered)
					res.render('message', { message: "You tried to access a nonexistent bingo card.", 'user': u, 'config': config });
			} else
				res.redirect('/');
		}
	);
	router.get('/bingo/activate', 
		isLoggedIn,
		isLocked,
		function(req,res,next) {
			var u = req.session.user;			
			var Presentation = req.db.Presentation;
			if (req.query.q) {
				var chosenId = req.query.q;
				var rendered = 0;

				console.log(JSON.stringify(u.presentation));
				for (var i = 0; i < u.presentation.length; ++i)
					for (var j = 0; j < u.presentation[i].bingo.length; ++j) {
						if (u.presentation[i].bingo[j].id == chosenId) {
							Presentation.findById(u.presentation[i].id, function(err, pres) {
								if (! pres.prop.test) { pres.prop.test = {}; }
								if (! pres.prop.active) { pres.prop.active = {}; }
								pres.prop.active.id = chosenId;
								pres.prop.test.id = null;
								pres.prop.active.start = new Date();
								pres.markModified('prop');
								pres.save(function(err,savedDoc) {
									res.redirect('/profile');
								})
							});
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
	router.get('/bingo/test/off',
		isLoggedIn,
		isLocked,
		function(req,res,next) {
			if (req.query.q) {
				var q = req.query.q,
					rendered  = 0;
				var Presentation = req.db.Presentation;
				for (var i = 0; i < req.session.user.presentation.length; ++i) {
					if (req.session.user.presentation[i]._id == q) {
						Presentation.findById(q, function(err,foundP) {
							if (err)
								log.warn(err);
							else {
								if (! foundP.prop.test) found.prop.test = {};
								foundP.prop.test.id = null;
								foundP.prop.test.stop = new Date();
								foundP.markModified('prop');
								foundP.save(function(err,savedDoc) {
									res.redirect('/profile');
								});
							}
						});
						rendered = 1;
						break;
					}
				}
				if (! rendered)
					res.render('message', { message: "You tried to access a nonexistent bingo card.", 'user': u, 'config': config });
			}
		}
	);
	router.get('/bingo/activate/off',
		isLoggedIn,
		isLocked,
		function(req,res,next) {
			if (req.query.q) {
				var q = req.query.q,
					rendered  = 0;
				var Presentation = req.db.Presentation;
				for (var i = 0; i < req.session.user.presentation.length; ++i) {
					if (req.session.user.presentation[i]._id == q) {
						Presentation.findById(q, function(err,foundP) {
							if (err)
								log.warn(err);
							else {
								if (! foundP.prop.active) foundP.prop.active = {};
								foundP.prop.active.id = null;
								foundP.prop.active.stop = new Date();
								foundP.markModified('prop');
								foundP.save(function(err,savedDoc) {
									res.redirect('/profile');
								});
							}
						});
						rendered = 1;
						break;
					}
				}
				if (! rendered)
					res.render('message', { message: "You tried to access a nonexistent bingo card.", 'user': req.session.user, 'config': config });
			}
		}
	);



//	static pages
	router.get('/static/about', function(req,res,next) {
		res.render('about', { title: 'About this site', tabChoice: 'about', config: config, 'user': req.session.user });
	});
	router.get('/static/tos', function(req,res,next) {
		res.render('tos', { title: 'Terms of service', tabChoice: 'tos', config: config, 'user': req.session.user });
	});
	router.get('/static/contact', function(req,res,next) {
		res.render('contact', { title: 'Contact us', tabChoice: 'contact', config: config, 'user': req.session.user });
	});
	router.post('/static/contact', function(req,res,next) {
		req.app.mailer.send('email-contact', {
			to: config.contactAddress,
			subject: '[Speaker Bingo] ' + req.body.subject,
			name: req.body.name,
			email: req.body.email,
			rawSubject: req.body.subject,
			message: req.body.message
		}, function(err) {
			if (err) { log.info('err when sending email: ' + err); }
			res.render('contact-thanks', { title: 'Contact us', tabChoice: 'contact', config: config, 'user': req.session.user });
		});
	});

	return router;
};
