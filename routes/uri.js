
module.exports = (options) => {
	var express = require('express');
	var router = express.Router();
	var db = options.db;

	router.get('/', function(req,res,next) {
		res.render('index', { title: 'URI hell', message: ''});
	});

	router.get('/:uri', function(req,res,next) {
		db.presentation.findByUriNoPwd(req.params.uri, function(err,presentation) {
			if (presentation)
				res.render('uri-hello', { uri: req.params.uri })
			else
				res.render('index', { title: 'URI hell', message: 'URI not found' });
		});
	})

	return router;
};