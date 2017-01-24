// admin site routes

module.exports = (options) => {
	var config = options.config;
	var log = config.log;

	var express = require('express');
	var bcrypt = require('bcrypt');
	var md5 = require('md5');

	var router = express.Router();

	var mongoose = require('mongoose');
	var Schema = mongoose.Schema;

	var  userRoutes = require('./user')(options); // load up user admin routes
	var adminRoutes = require('./admin')(options); // admin screens
	var bingoRoutes = require('./bingo')(options);
	var staticRoutes = require('./static')(options);

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
	return router;
};
