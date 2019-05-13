var bodyParser = require('body-parser');
var app = require('express')();
var http = require("http").Server(app);
var io = require("socket.io")(http);
const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');

const saltRounds = 10;
const port= process.env.PORT || 9001;

const sequelize = new Sequelize('Nooma', 'nooma42', 'rq4HEe9BGPJ2nQtK', {
  host: 'nooma.database.windows.net',
  dialect: 'mssql',
     
  define: {
    charset: 'utf8',
    collate: 'utf8_general_ci'
  },
  
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  
  dialectOptions: {
    encrypt: true,
  },
  operatorsAliases: false
});


app.use(bodyParser.json()); // for parsing application/json


//socket.io handlers
io.on('connection', function(socket){
    console.log("***** New Socket Connection!!! *****");
	//handling chat messages
	socket.on('chat', function(msg){
		console.log('message: ' + msg);
		socket.broadcast.emit('chat', msg);
	});
	//handling joining of channels 
	socket.on('channel', function(room) {
		console.log("channel joining... " + room.channelID);
		socket.leaveAll(); 
        socket.join(room.channelID);
    });
	
});

//empty response to test url working	
app.get("/", function(request, response) {
	response.end("Empty response! Cool! :)");
});

//gets a specific user
app.route("/users/:userId")
    .get(function(request, response) {
		var userId = request.params.userId;
		sequelize.query("EXEC GetUser :userID", {replacements: {userID: userId}}).then(myTableRows => {
			console.log(myTableRows[0])
			response.end(JSON.stringify(myTableRows[0]));
		})
    })
	
//create new user	
app.route("/users")
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
	
//create new lecturer user
app.route("/lecturer")
	//{"firstName": "Jeff", "lastName": "Gold", "email": "jgold@email.com", "pwd": "X"}
	.post(function(request, response) { 
		//hash password
		var pwd = request.body.pwd;
		bcrypt.hash(pwd, saltRounds, function(err, hash) {
			sequelize.query("EXEC CreateLecturer :firstName, :lastName, :email, :pwd",
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
	
//for authenticating student users passwords
app.route("/authenticate")
	//{"email": "jgold@email.com", "pwd": "X"}
	.post(function(request, response) {
		response.set('Content-Type', 'application/json; charset=utf-8');
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

//for authenticating lecturer users passwords
app.route("/authenticateLecturer")
	//{"email": "jgold@email.com", "pwd": "X"}
	.post(function(request, response) {
		console.log("Authenticating Student user..");
		var email = request.body.email;
		var pwd = request.body.pwd;
		console.log(email);
		sequelize.query("EXEC GetLecturerHash :Email", { plain: true, replacements: {Email: email}}).then(myTableRows => {
			var storedHash = myTableRows.pwd;
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

//deletes room
app.route("/rooms/:roomId")
    .delete(function(request, response) {
		
		var roomId = request.params.roomId;
		
		sequelize.query("EXEC DeleteRoom :roomID", {replacements: {roomID: roomId}}).then(myTableRows => {
			response.end(JSON.stringify(myTableRows[0]));
		})
    })		

//update room
app.route("/rooms/:roomId")
    .put(function(request, response) {
		
		var roomId = request.params.roomId;
		
		var roomname = request.body.roomName;
		var eventdate = request.body.eventDate;
		
		sequelize.query("EXEC EditRoom :roomID, :roomName, :eventDate", {replacements: {roomID: roomId, roomName: roomname, eventDate: eventdate}}).then(myTableRows => {
			response.end(JSON.stringify(myTableRows[0]));
		})
    })		

//joins a room based on join code
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

//deletes a channel
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
		var isanonymous = request.body.isAnonymous;
	
		var msg = {}
		msg.messageContent = messagecontent;
		
		sequelize.query("EXEC CreateMessage :channelID, :userID, :messageContent, :sendDate, :isAnonymous", {replacements: {channelID: channelId, userID: userId, messageContent: messagecontent, sendDate: senddate, isAnonymous: isanonymous}}).then(myTableRows => {
			msg.username = myTableRows[0][0].username;
			msg.messageID = myTableRows[0][0].messageID;
			msg.userID = userId;
			msg.sendDate = senddate;
			msg.channelID = channelId;
			
			console.log(messagecontent);
			console.log("sending: " + senddate + " - " + msg.userID);
			io.sockets.in(msg.channelID).emit('chat', msg);
		
			response.end(JSON.stringify(myTableRows[0]));
		})
    })	
	
//deletes a specific message from a channel
app.route("/channelMessage/:messageId")	
    .delete(function(request, response) {
		
		var messageId = request.params.messageId;
		
		sequelize.query("EXEC DeleteChannelMessage :messageID", {replacements: {messageID: messageId}}).then(myTableRows => {
			response.end(JSON.stringify(myTableRows[0]));
			
			var msg = {}
			msg.channelID = myTableRows[0][0].channelID;
			msg.messageID = messageId;
			io.sockets.in(msg.channelID).emit('delete', msg);
			
			response.end(JSON.stringify(myTableRows[0]));
		})
    })	
	
//gets students joined room list
app.route("/studentRooms/:userID")
    .get(function(request, response) {
		
		var userId = request.params.userID;
		
		sequelize.query("EXEC GetStudentRooms :userID", {replacements: {userID: userId}}).then(myTableRows => {
			response.end(JSON.stringify(myTableRows[0]));
		})
    })
	
//updates students password
app.route("/setStudentPassword/:userId")
    .post(function(request, response) {
		
		var userId = request.params.userId;
		
		var newpwd = request.body.newPwd;
		var oldpwd = request.body.oldPwd;
		
		sequelize.query("EXEC GetHash2 :userID", { plain: true, replacements: {userID: userId}}).then(myTableRows => {
			var storedHash = myTableRows.pwd;
			
			bcrypt.compare(oldpwd, storedHash, function(err, res) {
				console.log("password is " + res);
			if (res == false)
			{
				//myTableRows[0] = "passwordWrong";
				response.end("[{\"status\": \"passwordWrong\"}]");
				return;
			}
			else
			{
				bcrypt.hash(newpwd, saltRounds, function(err, hash) {
					sequelize.query("EXEC SetStudentPassword :userID, :newPwd", {replacements: {userID: userId, newPwd: hash}}).then(myTableRows => {
						console.log(myTableRows[0])
						response.end(JSON.stringify(myTableRows[0]));
					})
				})				
			}
			});
		})
		

    })
	
http.listen(port,function() {
	console.log ( " Server listening on port " + port );
});