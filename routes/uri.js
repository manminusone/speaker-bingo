
// uri site routes

module.exports = (options) => {
	var express = require('express');
	var router = express.Router();
	var db = options.db;

	router.get('/', function(req,res,next) {
		res.render('index', { title: 'URI hell', message: ''});
	});

	router.get('/:uri', function(req,res,next) {
		db.presentation.findByUriNoPwd(req.params.uri, function(err,presentation) {
			if (presentation) {
				if(presentation.testBingoId) {
					db.bingo.findById(presentation.testBingoId, function(err,bingoDoc) {
						var thesechoices = Array(), tmp = bingoDoc.choices;
						while (thesechoices.length < 24 && tmp.length > 0) {
							var thisone;
							do {
								thisone = tmp.splice(Math.floor(Math.random() * tmp.length), 1);
							} while (thisone == '' && tmp.length > 0);
							if (thisone != '')
								thesechoices.push(thisone);
						}
						res.render('uri-card', { uri: req.params.uri, title: bingoDoc.title, choices: thesechoices });
					});
				} else
					res.render('uri-hello', { uri: req.params.uri })
			}
			else
				res.render('index', { title: 'URI hell', message: 'URI not found' });
		});
	})

	return router;
};