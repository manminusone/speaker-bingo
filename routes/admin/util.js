module.exports = (options) => {
	var config = options.config;
	var log = config.log;
	var retval = {
		'isLoggedIn': function(req,res,next) {
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
		},
		'isLocked': function(req,res,next) {
			log.debug('entering isLocked');
			if (req.session.user && req.session.user.prop && req.session.user.prop.lock)
				res.render('message', { 'tabChoice': 'account', 'config': config, 'title': 'Account locked', 'message': 'Your account was created, but has been locked due to unusual activity. Please contact the admins for further information. Thanks.'})
			else
				next();

		},
		'isAdmin': function(req,res,next) {
			log.debug('entering isAdmin');
			if (req.session.user && req.session.user.prop && req.session.user.prop['admin'])
				next();
			else
				res.redirect('/');
		}
	};
	return retval;
};
