module.exports = (options) => {
	var config = options.config;
	var log = config.log;

	return {

		userGetSignup: function(req,res,next) {
			if (req.session.userId)
				res.redirect('/profile');
			else if (! config.allowSignup)
				res.render('message', { 
						'tabChoice': 'account', 
						'config': config, 
						'title': 'Account creation not allowed', 
						'message': 'Account creation is currently disabled by the admins. Please contact us if you want to create a new account.'
					});
			else
				res.render('user-signup', { tabChoice: 'account', title: 'Sign up', message: '', config: config });
		},

		userPostSignup: function(req,res,next) {
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
										res.render('user-signup', { tabChoice: 'account', title: 'Sign up', message: err, email: req.body.email, config: config });
									} else if (config.confirmByEmail) {
										// TODO - change this
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
		},

		userGetActivation: function(req,res,next) {
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
								// TODO - change this
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
		}
	}	
}
