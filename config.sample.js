
'use strict';
exports.port = process.env.PORT | 3000;
exports.mongodb = {
	uri: process.env.MONGOLAB_URI ||
	  process.env.MONGOHQ_URL ||
	  'mongodb://localhost:27017/speaker-bingo'
};
exports.vhost = {
	"adminDomain": "admin.speaker-bingo.local",
	"uriDomain": "speaker-bingo.local"
};


// allow users to create new accounts
exports.allowSignup = true;
// send emails for activation
exports.confirmByEmail = true;


// https://github.com/RGBboy/express-mailer
exports.contactAddress = 'your@address.here';
exports.mailer = {
	from: 'from-email@email.com',
	host: 'smtp.gmail.com',
	secureConnection: true,
	port: 465,
	transportMethod: 'SMTP',
	auth: {
		user: 'your-address-here@gmail.com',
		pass: 'p@ssw0rd'
	}
};
exports.socialMedia = {
	twitter: '',
	facebook: '',
	flickr: '',
	instagram: '',
	github: '',
	googleplus: ''
};
