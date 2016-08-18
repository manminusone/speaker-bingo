
module.exports = (options) => {
	var express = require('express');
	var router = express.Router();
	var db = options.db;

	router.get('/', function(req,res,next) {
		res.render('index', { title: 'URI hell'});
	});

	return router;
};