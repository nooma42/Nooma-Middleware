express = require("express");
var app = express();
var DB = require('./DBConnectScript.js');


var port = 9001;


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
		DB.exec("EXEC GetUser 5");
		response.end("done");
	})
	//create new user
	.post(function(request, response) {
		response.end("Create new user!");
	})

app.route("/users/:userId")
	.get(function(request, response) {
		var userId = request.params.userId;
		response.end();
	})

	
var server = app.listen(port, function() {
	console.log("Server starting on " + port); 
});