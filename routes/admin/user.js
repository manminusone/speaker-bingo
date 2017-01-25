module.exports = (options) => {
	var config = options.config;
	var log = config.log;

	var express = require('express');
	var util = require('./util');
	var gravatar = require('gravatar');

	var util = require('./util')(options);
	console.log(util);


	var router = express.Router();

	var mongoose = require('mongoose');
	var Schema = mongoose.Schema;

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
		util.isLoggedIn,
		util.isLocked,
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
										'hash': product.prop.authHash,
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
		}
	);
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
		} else
			res.redirect('/');
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
			log.info("finding user. doc = " + JSON.stringify(doc));
			if (doc) 
				bcrypt.compare(req.body.pwd, doc.hash, function(err,okay) {
					if (okay) {
						if (! doc.prop)
							doc.prop = {};
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
		util.isLoggedIn,
		util.isLocked,
		function(req,res,next) {
			console.log(JSON.stringify(req.session.user.presentation[0]));

			res.render('user-profile', { 'title': 'User Profile', 'tabChoice': 'profile', config: config, user: req.session.user, gravatar: gravatar.url(req.session.user.email) });
		}
	);
	router.post('/profile/save',
		util.isLoggedIn,
		util.isLocked,
		function(req,res,next) {
			if (req.body.email != req.session.user.email) {  // email changed
				var User = req.db.User;
				User.findById(req.session.user._id, function(err,u) {
					if (u) {
						var millis = new Date().getMilliseconds();
						u.prop.emailHash = md5(u.email + ' ' + millis.toString());
						u.prop.newEmail = req.body.email;
						u.markModified('prop');
						u.save(function(err) {
							req.app.mailer.send('email/change',
								{
									'to': req.body.email,
									'from': config.mailer.from,
									'subject': 'Speaker Bingo - email change',
									'hash': u.prop.emailHash,
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


					}
				})
			}
		}
	);
	router.get('/profile/email',
		util.isLoggedIn, // @@@
		util.isLocked,
		function (req,res,next) {
			var User = req.db.User;
			if (req.query.q) {
				User.findOne({'_id': req.session.user._id, 'prop.emailHash': req.query.q}).exec(function(err,u) {
					if (u) {
						u.prop.authHash = null;
						u.prop.authenticated = true;
						u.markModified('prop');
						u.save(function(err,newU) {
							res.render('message', { 'tabChoice': 'account', 'config': config, 'title': (err ? err : 'Success'), 'message' : (err ? 'This operation did not work: ' + err : 'You are good to go! Head over to the login page.') });
						})
					}
				})
			} else
				res.redirect('/');
		}
	);
	return router;

};