
// uri site routes

module.exports = (options) => {
	var express = require('express');
	var router = express.Router();
	var config = options.config;

	router.get('/', function(req,res,next) {
		res.render('index', { title: 'URI hell', message: ''});
	});

	router.get('/:uri', function(req,res,next) {
		var User = req.db.User, Presentation = req.db.Presentation, Bingo = req.db.Bingo;

		console.log(JSON.stringify(req.session));
		Presentation.findOne(
		 { 'uri': req.params.uri }, 
		 function(err,presentation) {
			if (presentation) {
				if(presentation.prop.test && presentation.prop.test.id) {
					Bingo.findById(
					 presentation.prop.test.id,
					 function(err,bingoDoc) {
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
				} else if (presentation.prop.active && presentation.prop.active.id) {
					Bingo.findById(
					 presentation.prop.active.id,
					 function(err,bingoDoc) {
					 	console.log(req.session.mylist);
					 	if (! req.session.mylist) {
					 		req.session.mylist = new Array();
							var tmp = bingoDoc.choices;
							while (req.session.mylist.length < 24 && tmp.length > 0) {
								var thisone;
								do {
									thisone = tmp.splice(Math.floor(Math.random() * tmp.length), 1);
								} while (thisone == '' && tmp.length > 0);
								if (thisone != '')
									req.session.mylist.push(thisone[0]);
							}
							console.log(req.session.mylist);
						}
						res.render('uri-card', { uri: req.params.uri, title: bingoDoc.title, choices: req.session.mylist });
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