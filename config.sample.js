
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
