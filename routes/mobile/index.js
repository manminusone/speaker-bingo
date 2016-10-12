

// uri site routes

module.exports = (options) => {
	var express = require('express');
	var router = express.Router();
	var config = options.config;
	var adminUrl = (config.port == 443 ? 'https://' : 'http://') + config.vhost.adminDomain + (config.port != 443 & config.port != 80 ? ':' + config.port : '');

	router.get('/', function(req,res,next) {
		res.redirect(adminUrl);
	});

	router.get('/:uri', function(req,res,next) {
		var User = req.db.User, Presentation = req.db.Presentation, Bingo = req.db.Bingo, Audit = req.db.Audit;

		console.log('get /:uri');
		if (req.params.uri == '')
			res.redirect(adminUrl);

		console.log(JSON.stringify(req.session));
		Presentation.findOne(
		 { 'uri': req.params.uri }, 
		 function(err,presentation) {
			if (presentation) {
				if (presentation.prop && presentation.prop.lock)  // just render a generic page if URI is locked
					res.render('uri-hello', { uri: req.params.uri });
				
				else if(presentation.prop.test && presentation.prop.test.id) { // just testing
					Bingo.findById(
					 presentation.prop.test.id,
					 function(err,bingoDoc) {
						var thesechoices = Array(), tmp = bingoDoc.choices.slice(0);
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
				
				} else if (presentation.prop.active && presentation.prop.active.id) { // game is running
					Bingo.findById(
					 presentation.prop.active.id,
					 function(err,bingoDoc) {
					 	console.log(req.session.pres);
					 	if (! req.session.pres) 
					 		req.session.pres = {};

					 	console.log(req.session.starttime);
					 	console.log(presentation.prop.active);
					 	if (! req.session.pres[req.params.uri] || new Date(req.session.starttime).getTime() < new Date(presentation.prop.active.start).getTime()) {
					 		req.session.starttime = new Date();
					 		req.session.pres[req.params.uri] = new Array();
							var tmp = bingoDoc.choices.slice(0); // don't want to affect original array

							while (req.session.pres[req.params.uri].length < 24 && tmp.length > 0) {
								var thisone;
								do {
									thisone = tmp.splice(Math.floor(Math.random() * tmp.length), 1);
								} while (thisone == '' && tmp.length > 0);
								if (thisone != '')
									req.session.pres[req.params.uri].push(thisone[0]);
							}
							// console.log(req.session.pres[req.params.uri]);

							var a = new Audit({ 'uri': req.params.uri, 'key': 'GAMESTART' });
							a.save(function(err,saved_audit) { 
								bingoDoc.audit.push(saved_audit);
								console.log(JSON.stringify(bingoDoc));
								bingoDoc.save(function(err) { console.log('err = ' + err); });
							});
						}
						res.render('uri-card', { uri: req.params.uri, title: bingoDoc.title, choices: req.session.pres[req.params.uri] });
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