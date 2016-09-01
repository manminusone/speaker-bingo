module.exports = (options) => {
	var config = options.config;
	var db = options.db;
	var mailer = options.mailer;
	console.log(mailer);

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
	};
};