module.exports = (options) => {
	var config = options.config;
	var log = config.log;
	var db = options.db;
	var mailer = options.mailer;
	// console.log(mailer);

	return {
		user: {
			sendActivation: function(user,cb) {
				var a = db.activation.new(user);
				mailer.send('email/activation',
					{to: user.email,
					from: config.mailer.from,
					subject: 'Speaker Bingo - activation',
					activation: a},
					function(err) {
						cb(err);
					}
					);
			}
		}

		queue: function(i,cb) {
			// save the email to the db
			var et = new db.EmailTaskSchema(i);
			et.save(function(err,obj,numAffected) {
				if (err) {
					log.error("error saving EmailTask record - "+err);
					cb(err);
				} else {
					cb('');
				}
			});
		},
		process: function(cb) {
			// grab an email from the db
			db.EmailTaskSchema.findOne({}).exec(function(err,rec) {
				if (rec) { // process the record
					mailer.send(
						rec.template, {
							to: rec.email,
							from: config.mailer.from,
							subject: rec.subject,
							param: rec.param
						},
						function(err) {
							cb(err);
						}
					);
				}
			})
		}
	};
};