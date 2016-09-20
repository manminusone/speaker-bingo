module.exports = (options) => {
	var express = require('express');
	var router = express.Router();
	var config = options.config;

	router.get('/uri/:uri', function(req,res,next) {
		var Presentation = req.db.Presentation;
		Presentation.findOne({ uri : req.params.uri }, function(err,doc) {
			console.log('err = ' + err+ ', doc = ' + doc);
			if (doc)
				res.json({ uri: req.params.uri, exists: true});
			else
				res.json({ uri: req.params.uri, exists: false });
		})
	});
	return router;
};