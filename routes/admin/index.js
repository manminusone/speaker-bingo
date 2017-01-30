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

	router = require('./user')(options,router); // load up user admin routes
	router = require('./admin')(options,router); // admin screens
	router = require('./bingo')(options,router);
	router = require('./static')(options,router);

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
