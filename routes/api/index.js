module.exports = (options) => {
	var express = require('express');
	var router = express.Router();
	var db = options.db;
	var config = options.config;
	var userlib = options.userlib;
	var doclib = options.doclib;

	router.get('/uri/:uri', function(req,res,next) {
		doclib.presentation.find({ uri : req.params.uri }, function(err,doc) {
			if (doc)
				res.json({ uri: req.params.uri, exists: true});
			else
				res.json({ uri: req.params.uri, exists: false });
		})
	});
	return router;
};