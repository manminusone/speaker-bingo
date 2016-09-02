module.exports = (options) => {
	var express = require('express');
	var router = express.Router();
	var db = options.db;
	var config = options.config;

	router.get('/uri/:uri', function(req,res,next) {
		db.presentation.findByUriNoPwd(req.params.uri, function(err,doc) {
			if (doc)
				res.json({ uri: req.params.uri, exists: true});
			else
				res.json({ uri: req.params.uri, exists: false });
		})
	});
	return router;
};