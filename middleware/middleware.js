var express = require("express");
var bodyParser = require('body-parser');
var app = express();

const Sequelize = require('sequelize');
const sequelize = new Sequelize('Nooma', 'nooma42', 'rq4HEe9BGPJ2nQtK', {
  host: 'nooma.database.windows.net',
  dialect: 'mssql',

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    encrypt: true
  },
  operatorsAliases: false
});

const bcrypt = require('bcryptjs');
const saltRounds = 10;

var port = 9001;

app.use(bodyParser.json()); // for parsing application/json

	
app.get("/", function(request, response) {
	response.end("Empty response! Cool! :)");
});

app.route("/users/:userId")
    .get(function(request, response) {
		var userId = request.params.userId;
		sequelize.query("EXEC GetUser :userID", {replacements: {userID: userId}}).then(myTableRows => {
			console.log(myTableRows[0])
			response.end(JSON.stringify(myTableRows[0]));
		})
    })
	
app.route("/users")
	//create new user
	//{"firstName": "Jeff", "lastName": "Gold", "email": "jgold@email.com", "pwd": "X", "accountType":1}
	.post(function(request, response) { 
		//hash password
		var pwd = request.body.pwd;
		bcrypt.hash(pwd, saltRounds, function(err, hash) {
			sequelize.query("EXEC CreateUser :firstName, :lastName, :email, :pwd, :accountType",
			{replacements: {
				firstName: request.body.firstName,
				lastName: request.body.lastName, 
				email: request.body.email,
				pwd: hash,
				accountType: request.body.accountType
				}}).then(myTableRows => {
					console.log(myTableRows[0]);
				response.end(JSON.stringify(myTableRows[0]));
			})
		});
	})

	
//for authenticating users passwords
app.route("/authenticate")
	//{"email": "jgold@email.com", "pwd": "X"}
	.get(function(request, response) {
		console.log("Authenticating user..");
		var email = request.body.email;
		var pwd = request.body.pwd;
		
		sequelize.query("EXEC GetHash :email", {plain: true, replacements: {email: email}}).then(myTableRows => {
			var storedHash = myTableRows.pwd;
			bcrypt.compare(pwd, storedHash, function(err, res) {
				console.log(res);
				response.end(res.toString());
			});
		})
	})

	
var server = app.listen(port, function() {
	console.log("Server starting on " + port); 
});