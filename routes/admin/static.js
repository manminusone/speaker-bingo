module.exports = (options,router) => {
	var config = options.config;
	var log = config.log;
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