express = require("express");
var tediousExpress = require('express4-tedious');
const bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
var TYPES = require('tedious').TYPES
var app = express();

const saltRounds = 10;

var port = 9001;

app.use(bodyParser.json()); // for parsing application/json

app.use(function (req, res, next) {
    req.sql = tediousExpress(config);
    next();
});


var config = {
  userName: 'nooma42', // update me
  password: 'rq4HEe9BGPJ2nQtK', // update me
  server: 'nooma.database.windows.net',
  options: {
	  encrypt: true,
	   database: 'Nooma'
  }
}
	
app.get("/", function(request, response) {
	response.end("Empty response! Cool! :)");
});

app.route("/users")
	//Gets all users 
	.get(function(request, response) {
		response.end("all users here!");
	})
	//create new user
	//{"firstName": "Jeff", "lastName": "Gold", "email": "jgold@email.com", "pwd": "X", "accountType":1}
	.post(function(request, response) { 
		//hash password
		console.log("REQUEST BODY = " + request.body.firstName);
		var pwd = request.body.pwd;
		bcrypt.hash(pwd, saltRounds, function(err, hash) {
			request.sql("EXEC CreateUser @firstName, @lastName, @email, @pwd, @accountType")
			.param('firstName', request.body.firstName, TYPES.VarChar)
			.param('lastName', request.body.lastName, TYPES.VarChar)
			.param('email', request.body.email, TYPES.VarChar)
			.param('pwd', hash, TYPES.Char)
			.param('accountType', request.body.accountType, TYPES.Int)
			.into(response);
			//.exec(request);
			
		});
	})

app.route("/users/:userId")
	.get(function(request, response) {
		var userId = request.params.userId;
		request.sql("EXEC GetUser "+userId)
		.into(response);
	})

app.route("/authenticate/:userId")
	.get(function(request, response) {
		console.log("Authenticating user..");
		var userId = request.params.userId;
		request.sql("EXEC GetHash "+userId)
		.into(response);
		
		response.end(request.body);
	})

	
var server = app.listen(port, function() {
	console.log("Server starting on " + port); 
});