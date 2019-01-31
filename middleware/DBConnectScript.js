var Connection = require('tedious').Connection;
var Request = require('tedious').Request;

var config = {
  userName: 'nooma42', // update me
  password: 'rq4HEe9BGPJ2nQtK', // update me
  server: 'nooma.database.windows.net',
  options: {
	  encrypt: true,
	   database: 'Nooma'
  }
}

var connection = new Connection(config);

connection.on('connect', function(err) {
  if (err) {
    console.log(err);
  } else {
    executeStatement();
  }
});

function executeStatement() {
  request = new Request("select * from dbo.users", function(err, rowCount) {
    if (err) {
      console.log(err);
    } else {
      console.log(rowCount + ' rows');
    }
    connection.close();
  });

  request.on('row', function(columns) {
    columns.forEach(function(column) {
      if (column.value === null) {
        console.log('NULL');
      } else {
        console.log(column.value);
      }
    });
  });

  connection.execSql(request);
}