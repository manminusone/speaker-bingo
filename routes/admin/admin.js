module.exports = (options,router) => {
	var config = options.config;
	var log = config.log;

	var util = require('./util')(options);

	// admin
	router.get('/admin', 
		util.isLoggedIn,
		util.isLocked,
		util.isAdmin,
		function(req,res,next) {
			res.render('admin-index', { tabChoice: 'admin', user: req.session.user, 'config': config, 'userlist': [] })
		}
	);

	return router;
}