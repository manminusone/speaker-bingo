// admin site routes

module.exports = (options) => {
	var config = options.config;
	var log = config.log;
	var express = require('express');
	var gravatar = require('gravatar');

	var util = require('./util');


	var router = express.Router();


	router.post('/presentation/new', 
		util.isLoggedIn,
		util.isLocked,
		function(req,res,next) {
			var Presentation = req.db.Presentation;

			Presentation.findOne({ uri: req.body.uri }).exec(function(err,doc) {
				if (doc) {
					res.render('user-profile', { 'title': 'User Profile', 'tabChoice': 'profile', config: config, message: 'Your URI choice already exists. Try again.', user: req.session.user, gravatar: gravatar.url(req.session.user.email) });
				} else {
					Presentation({ uri: req.body.uri, prop: { 'created': new Date() } })
					.save(function(err,newP) {
						req.session.user.presentation.push(newP);
						req.session.user.save(function(err,savedUser) {
							res.redirect('/profile');
						});
					});
				}
			});
		}
	);


	// bingo routes

	router.get('/bingo/:num/new',
		util.isLoggedIn,
		util.isLocked,
		function(req,res,next) {
			res.render('bingo-new', { 'title': 'New Bingo Card', 'config': config, 'presentationNum': req.params.num, 'user': req.session.user });
		});

	router.post('/bingo/save', 
		util.isLoggedIn,
		util.isLocked,
		function(req,res,next) {

			var choices = JSON.parse(req.body.choices);
			var pid = req.body.presentationNum;
			var u = req.session.user;
			var Bingo = req.db.Bingo;
			req.session.user = null;

			if(req.body.bingoId) {
				Bingo.findById(req.body.bingoId, function(err,doc) {
					doc.title = req.body.bingoTitle;
					doc.choices = choices;
					doc.save(function(err,newdoc) {
						if (err)
							log.error("Error saving existing Bingo record: " + err);
						res.render('bingo-edit', { 
							title: 'Edit card',
							message: (err ? 'Record was not saved! The admins have been alerted.' : 'Saved successfully'), 
							user: u,
							bingo: newdoc,
							config: config });
						});
					}
				);
			} else {
				Bingo({
					'title': req.body.bingoTitle,
					'choices': choices
				}).save(function(err,newBingo) {
					if (err)
						log.error("Error saving new Bingo record: " + err);
					u.presentation[pid].bingo.push(newBingo._id);
					u.presentation[pid].save(function(err,newdoc) {
						res.render('bingo-edit', {
							title: 'Edit card',
							message: (err ? "Record was not saved! The admins have been alerted." : 'Saved successfully'),
							user: u,
							bingo: newBingo,
							config: config
						});
					});
				});
			} // else
		} // middleware function
	); // post()

	router.get('/bingo/edit',
		util.isLoggedIn,
		util.isLocked,
		function(req,res,next) {
			if (req.query.q) {
				var u = req.session.user;
				var rendered = 0;
				for (var i = 0; i < u.presentation.length; ++i)
					for (var j = 0; j < u.presentation[i].bingo.length; ++j) {
						if (u.presentation[i].bingo[j]._id == req.query.q) {
							res.render('bingo-edit', {
								title: 'Edit card',
								message: '',
								user: u,
								bingo: u.presentation[i].bingo[j],
								config: config
							});
							rendered = 1;
							break;
						}
					}
				if (! rendered)
					res.render('message', { message: "You tried to edit a nonexistent bingo card.", user: u });
			} else
				res.redirect('/');
		});

	router.get('/bingo/test', 
		util.isLoggedIn,
		util.isLocked,
		function(req,res,next) {
			var u = req.session.user;
			var Presentation = req.db.Presentation;
			if (req.query.q) {
				var chosenId = req.query.q;
				var rendered = 0;

				for (var i = 0; i < u.presentation.length; ++i)
					for (var j = 0; j < u.presentation[i].bingo.length; ++j) {
						if (u.presentation[i].bingo[j]._id == chosenId) {
							Presentation.findById(u.presentation[i]._id, function(err, pres) {
								if (! pres.prop.test) pres.prop.test = {};
								if (! pres.prop.active) pres.prop.active = {};
								pres.prop.test.id = chosenId;
								pres.prop.active.id = null;
								pres.prop.test.start = new Date();
								pres.markModified('prop');
								pres.save(function(err,savedDoc) {
									res.redirect('/profile');
								})
							});
							rendered = 1;
							break;
						}
					}
				if (! rendered)
					res.render('message', { message: "You tried to access a nonexistent bingo card.", 'user': u, 'config': config });
			} else
				res.redirect('/');
		}
	);
	router.get('/bingo/activate', 
		util.isLoggedIn,
		util.isLocked,
		function(req,res,next) {
			var u = req.session.user;			
			var Presentation = req.db.Presentation;
			if (req.query.q) {
				var chosenId = req.query.q;
				var rendered = 0;

				console.log(JSON.stringify(u.presentation));
				for (var i = 0; i < u.presentation.length; ++i)
					for (var j = 0; j < u.presentation[i].bingo.length; ++j) {
						if (u.presentation[i].bingo[j].id == chosenId) {
							Presentation.findById(u.presentation[i].id, function(err, pres) {
								if (! pres.prop.test) { pres.prop.test = {}; }
								if (! pres.prop.active) { pres.prop.active = {}; }
								pres.prop.active.id = chosenId;
								pres.prop.test.id = null;
								pres.prop.active.start = new Date();
								pres.markModified('prop');
								pres.save(function(err,savedDoc) {
									res.redirect('/profile');
								})
							});
							rendered = 1;
							break;
						}
					}
				if (! rendered) 
					res.render('message', { message: "You tried to access a nonexistent bingo card.", 'user': u });
			} else
				res.redirect('/');
		}
	);
	router.get('/bingo/test/off',
		util.isLoggedIn,
		util.isLocked,
		function(req,res,next) {
			if (req.query.q) {
				var q = req.query.q,
					rendered  = 0;
				var Presentation = req.db.Presentation;
				for (var i = 0; i < req.session.user.presentation.length; ++i) {
					if (req.session.user.presentation[i]._id == q) {
						Presentation.findById(q, function(err,foundP) {
							if (err)
								log.warn(err);
							else {
								if (! foundP.prop.test) found.prop.test = {};
								foundP.prop.test.id = null;
								foundP.prop.test.stop = new Date();
								foundP.markModified('prop');
								foundP.save(function(err,savedDoc) {
									res.redirect('/profile');
								});
							}
						});
						rendered = 1;
						break;
					}
				}
				if (! rendered)
					res.render('message', { message: "You tried to access a nonexistent bingo card.", 'user': u, 'config': config });
			}
		}
	);
	router.get('/bingo/activate/off',
		util.isLoggedIn,
		util.isLocked,
		function(req,res,next) {
			if (req.query.q) {
				var q = req.query.q,
					rendered  = 0;
				var Presentation = req.db.Presentation;
				for (var i = 0; i < req.session.user.presentation.length; ++i) {
					if (req.session.user.presentation[i]._id == q) {
						Presentation.findById(q, function(err,foundP) {
							if (err)
								log.warn(err);
							else {
								if (! foundP.prop.active) foundP.prop.active = {};
								foundP.prop.active.id = null;
								foundP.prop.active.stop = new Date();
								foundP.markModified('prop');
								foundP.save(function(err,savedDoc) {
									res.redirect('/profile');
								});
							}
						});
						rendered = 1;
						break;
					}
				}
				if (! rendered)
					res.render('message', { message: "You tried to access a nonexistent bingo card.", 'user': req.session.user, 'config': config });
			}
		}
	);

	return router;
};