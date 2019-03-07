var bodyParser = require('body-parser');
var app = require('express')();
var http = require("http").Server(app);
var io = require("socket.io")(http);
const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');

const saltRounds = 10;
var port = 9001;

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


app.use(bodyParser.json()); // for parsing application/json


io.on('connection', function(socket){
		
	socket.on('chat', function(msg){
		console.log('message: ' + msg);
		socket.broadcast.emit('chat', msg);
	});
	socket.on('channel', function(room) {
		socket.leaveAll(); 
        socket.join(room);
    });
	
});
	
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
	//{"firstName": "Jeff", "lastName": "Gold", "email": "jgold@email.com", "pwd": "X"}
	.post(function(request, response) { 
		//hash password
		var pwd = request.body.pwd;
		bcrypt.hash(pwd, saltRounds, function(err, hash) {
			sequelize.query("EXEC CreateUser :firstName, :lastName, :email, :pwd",
			{replacements: {
				firstName: request.body.firstName,
				lastName: request.body.lastName, 
				email: request.body.email,
				pwd: hash
				}}).then(myTableRows => {
					console.log(myTableRows[0]);
				response.end(JSON.stringify(myTableRows[0]));
			})
		});
	})

	
//for authenticating users passwords
app.route("/authenticate")
	//{"email": "jgold@email.com", "pwd": "X"}
	.post(function(request, response) {
		console.log("Authenticating user..");
		var email = request.body.email;
		var pwd = request.body.pwd;
		console.log(email);
		sequelize.query("EXEC GetHash :Email", { plain: true, replacements: {Email: email}}).then(myTableRows => {
			var storedHash = myTableRows.pwd;
			//hide the password hash on return
			myTableRows.pwd = "Hidden";
			
			bcrypt.compare(pwd, storedHash, function(err, res) {
				console.log("password response: " + res);
				if (res == true)
					response.end(JSON.stringify(myTableRows));
				else
					response.end("Error");
			});
		})
	})


app.route("/authenticateLecturer")
	//{"email": "jgold@email.com", "pwd": "X"}
	.post(function(request, response) {
		console.log("Authenticating Student user..");
		var email = request.body.email;
		var pwd = request.body.pwd;
		console.log(email);
		sequelize.query("EXEC GetLecturerHash :Email", { plain: true, replacements: {Email: email}}).then(myTableRows => {
			var storedHash = myTableRows.pwd;

			bcrypt.compare(pwd, storedHash, function(err, res) {
				console.log("password response: " + res);
				if (res == true)
					response.end(JSON.stringify(myTableRows));
				else
					response.end("Error");
			});
		})
	})

	
const Project = sequelize.define('project', {
  lecturerID: {type: Sequelize.INTEGER },
  search: {type: Sequelize.TEXT, notEmpty: false}
})	

//get lecturers list of rooms
app.route("/rooms/:lecturerId")
    .get(function(request, response) {
		var lecturerId = request.params.lecturerId;
		
		var search = request.query.search;
		
		console.log("search text: " + search);
		sequelize.query("EXEC GetRooms :lecturerID, :searchText", {model: Project, replacements: {lecturerID: lecturerId, searchText: search}}).then(myTableRows => {
			response.end(JSON.stringify(myTableRows));
		})
    })

//post new room as a lecturer
app.route("/rooms/:lecturerId")
    .post(function(request, response) {
		
		var lecturerId = request.params.lecturerId;

		var roomname = request.body.roomName;
		var eventdate = request.body.eventDate;
		
		sequelize.query("EXEC CreateRoom :ownerID, :roomName, :eventDate", {replacements: {ownerID: lecturerId, roomName: roomname, eventDate: eventdate}}).then(myTableRows => {
			console.log(myTableRows[0])
			response.end(JSON.stringify(myTableRows[0]));
		})
    })
	
app.route("/rooms/:roomId")
    .delete(function(request, response) {
		
		var roomId = request.params.roomId;
		
		sequelize.query("EXEC DeleteRoom :roomID", {replacements: {roomID: roomId}}).then(myTableRows => {
			response.end(JSON.stringify(myTableRows[0]));
		})
    })		
	
app.route("/rooms/:roomId")
    .put(function(request, response) {
		
		var roomId = request.params.roomId;
		
		var roomname = request.body.roomName;
		var eventdate = request.body.eventDate;
		
		sequelize.query("EXEC EditRoom :roomID, :roomName, :eventDate", {replacements: {roomID: roomId, roomName: roomname, eventDate: eventdate}}).then(myTableRows => {
			response.end(JSON.stringify(myTableRows[0]));
		})
    })		

app.route("/joinRoom")
    .post(function(request, response) {
		
		var userId = request.body.userID;
		var joincode = request.body.joinCode;
		
		sequelize.query("EXEC JoinRoom :userID, :joinCode", {replacements: {userID: userId, joinCode: joincode}}).then(myTableRows => {
			response.end(JSON.stringify(myTableRows[0]));
		})
    })
	
//get channels for rooms
app.route("/channels/:roomId")
    .get(function(request, response) {
		
		var roomId = request.params.roomId;
		
		sequelize.query("EXEC GetChannels :roomID", {replacements: {roomID: roomId}}).then(myTableRows => {
			response.end(JSON.stringify(myTableRows[0]));
		})
    })
	.post(function(request, response) { 
		var roomId = request.params.roomId;
		
		var channelname = request.body.channelName;
		
		sequelize.query("EXEC CreateChannel :roomID, :channelName", {replacements: {roomID: roomId,channelName: channelname}}).then(myTableRows => {
			response.end(JSON.stringify(myTableRows[0]));
		})		
	})

app.route("/channel/:channelId")
	.delete(function(request, response) {
		
		var channelId = request.params.channelId;
		
		sequelize.query("EXEC DeleteChannel :channelID", {replacements: {channelID: channelId}}).then(myTableRows => {
			response.end(JSON.stringify(myTableRows[0]));
		})		
	})	

//gets history of messages for a channel	
app.route("/channelMessages/:channelId")
    .get(function(request, response) {
		
		var channelId = request.params.channelId;
		
		sequelize.query("EXEC GetChannelMessages :channelID", {replacements: {channelID: channelId}}).then(myTableRows => {
			response.end(JSON.stringify(myTableRows[0]));
		})
    })
	//posts a new message to a channel, including the socket 
    .post(function(request, response) {
		
		var channelId = request.params.channelId;
		
		var userId = request.body.userID;
		var messagecontent = request.body.messageContent;
		var senddate = request.body.sendDate;
		
		var msg = {}
		msg.messageContent = messagecontent;
		
		sequelize.query("EXEC CreateMessage :channelID, :userID, :messageContent, :sendDate", {replacements: {channelID: channelId, userID: userId, messageContent: messagecontent, sendDate: senddate}}).then(myTableRows => {
			msg.username = myTableRows[0][0].username;
			msg.messageID = myTableRows[0][0].messageID;
			msg.sendDate = myTableRows[0][0].sendDate;
			msg.channelID = channelId;
			
			console.log("sending: " + senddate);
			io.sockets.in(msg.channelID).emit('chat', msg);
		
			response.end(JSON.stringify(myTableRows[0]));
		})
    })		
	
http.listen(port,function() {
	console.log ( " Server listening on port " + port );
});