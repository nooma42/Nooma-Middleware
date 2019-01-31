express = require("express");
var app = express();

var port = 9001;

app.get("/", function(request, response) {
	response.end("Empty response! Cool! :)");
});

app.route("/users")
	//Gets all users 
	.get(function(request, response) {
		response.end("Get users!");
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