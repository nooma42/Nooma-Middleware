var Connection = require('tedious').Connection;
var Request = require('tedious').Request;

var config = {
  userName: 'nooma42', // update me
  password: 'rq4HEe9BGPJ2nQtK', // update me
  server: 'nooma.database.windows.net',
  options: {
	  encrypt: true,
	   database: 'Nooma'
  },
  rowCollectionOnRequestCompletion: true

}

var connection = new Connection(config);

connection.on('connect', connected);
connection.on('infoMessage', infoError);
connection.on('errorMessage', infoError);
connection.on('end', end);
connection.on('debug', debug);

function connected(err) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  //console.log('connected');

  process.stdin.resume();

  process.stdin.on('data', function (chunk) {
    exec(chunk);
  });

  process.stdin.on('end', function () {
    process.exit(0);
  });
}

function exec(sql) {
  sql = sql.toString();

  request = new Request(sql, statementComplete)
  request.on('columnMetadata', columnMetadata);
    request.on('row', row);
    request.on('doneInProc', requestDone);

  connection.execSql(request);
  return "hello";
}
module.exports = {exec}

function requestDone(rowCount, more, rows) {
	
  console.log( more + ' hello! ' + rowCount + " - " + rows);
  
}

function statementComplete(err, rowCount) {
  if (err) {
    console.log('Statement failed: ' + err);
  } else {
    console.log(rowCount + ' rows');
  }
}

function end() {
  console.log('Connection closed');
  process.exit(0);
}

function infoError(info) {
  console.log(info.number + ' : ' + info.message);
}

function debug(message) {
  //console.log(message);
}

function columnMetadata(columnsMetadata) {
  columnsMetadata.forEach(function(column) {
    //console.log(column);
  });
}

function row(columns) {
  var values = {};

  columns.forEach(function(column) {
    if (column.value === null) {
      value = 'NULL';
	  values[column.metadata.colName] = "NULL";
    } else {
      values[column.metadata.colName] = column.value;
    }
  });

  console.log(values);
}