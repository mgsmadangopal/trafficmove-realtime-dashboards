var express = require('express');
var app = express();
var server = require('http').Server(app); 
var io = require('socket.io')(server); // attach socket.io to the server
var kafka = require('kafka-node');
var cassandra = require('cassandra-driver');



server.listen(3000);

app.use(express.static(__dirname + '/public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/historical', function (req, res) {
  res.sendFile(__dirname + '/public/historical.html');
});

console.log("Starting Stream Consumer...");

var KafkaAvro = require('kafka-avro')
//console.log(KafkaAvro.CODES);
 
var kafkaAvro = new KafkaAvro({
    kafkaBroker: 'localhost:9092',
    schemaRegistry: 'http://localhost:8081',
});

// Query the Schema Registry for all topic-schema's
// fetch them and evaluate them.
kafkaAvro.init()
    .then(function() {
        console.log('Ready to use');
    });
    
kafkaAvro.getConsumer({
  'group.id': 'reporting-layer',
  'socket.keepalive.enable': true,
  'enable.auto.commit': false,
  'auto.offset.reset': 'earliest'
})
  // the "getConsumer()" method will return a bluebird promise.
  .then(function(consumer) {
    // Perform a consumer.connect()
    return new Promise(function (resolve, reject) {
      consumer.on('ready', function() {
        resolve(consumer);
      });
 
      consumer.connect({}, function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(consumer); // depend on Promises' single resolve contract.
      });
    });
  })
  .then(function(consumer) {
    // Subscribe and consume.
    var topicName = 'traffic-data-input';
    consumer.subscribe([topicName]);
    consumer.consume();
    consumer.on('data', function(rawData) {      
      //console.log('message:', rawData.parsed);
      io.emit(rawData.topic, rawData.parsed); // Reading Kafka topic value and Kafka message
    });
  });


//cassandra configurations
var client = new cassandra.Client({contactPoints: ['192.168.56.101'], keyspace: 'traffickeyspace'});


// Define action to take when a websocket connection is established
io.on('connection', function (socket) {
	console.log("A client is connected.");

	// fetch USER MAPS data from cassandra
	socket.on('fetch-latLong', function(query){
		client.execute(query, function(err, result){
			if (err) { console.log(err)};
			console.log('executing query: ' + query);
			io.emit('fetched-latLongData', result.rows);
			console.log(result.rows);
		});
	});

	// fetch vehical count data from cassandra
	socket.on('fetch-vehicleCountData',function(query){
		client.execute(query, function (err, result) {
			if(err){
				console.log(err);
			}
			console.log('executing query: ' + query);
			console.log('processing data');
			//console.log(result)
			// Data processing
			var chartData = [
				    {
				        key: 'Route-1',
				        values: [
				            {
				                "label" : "Large Truck" ,
				                "value" : 0
				            } ,
				            {
				                "label" : "Small Truck" ,
				                "value" : 0
				            } ,
				            {
				                "label" : "Private Car" ,
				                "value" : 0
				            } ,
				            {
				                "label" : "Bus" ,
				                "value" : 0
				            } ,
				            {
				                "label" : "Taxi" ,
				                "value" : 0
				            } 
				        ]
				    },
				    {
				        key: 'Route-2',
				        values: [
				            {
				                "label" : "Large Truck" ,
				                "value" : 0
				            } ,
				            {
				                "label" : "Small Truck" ,
				                "value" : 0
				            } ,
				            {
				                "label" : "Private Car" ,
				                "value" : 0
				            } ,
				            {
				                "label" : "Bus" ,
				                "value" : 0
				            } ,
				            {
				                "label" : "Taxi" ,
				                "value" : 0
				            } 
				        ]
				    },
				    {
				        key: 'Route-3',
				        values: [
				            {
				                "label" : "Large Truck" ,
				                "value" : 0
				            } ,
				            {
				                "label" : "Small Truck" ,
				                "value" : 0
				            } ,
				            {
				                "label" : "Private Car" ,
				                "value" : 0
				            } ,
				            {
				                "label" : "Bus" ,
				                "value" : 0
				            } ,
				            {
				                "label" : "Taxi" ,
				                "value" : 0
				            } 
				        ]
				    }
			];
			var count = 0;
			var routeid;
			result.rows.forEach(function(row){
					//console.log(row)
					console.log(row.routeid)
					if(row.routeid == "Route-1") {	
						routeid = 0;
					} else if(row.routeid == "Route-2") {
						routeid = 1;
					} else if(row.routeid == "Route-3") {
						routeid = 2;
					}	
						
					count = row.totalcount;
					console.log(routeid);
					switch(row.vehicletype)
					{
						case "Large Truck":
							chartData[routeid].values[0].value += count;
							break;
						case "Small Truck":
							chartData[routeid].values[1].value += count;
							break;
						case "Private Car":
							chartData[routeid].values[2].value += count;
							break;
						case "Bus":
							chartData[routeid].values[3].value += count;
							break;
						case "Taxi":
							chartData[routeid].values[4].value += count;
							break;
					}
			});
			//console.log(consolidatedArr);
			// send the updated arrays to client			
			var consolidatedArr = [chartData[0].values, chartData[1].values, chartData[2].values];
			io.emit('fetched-vehicleCountData', consolidatedArr); 
		});
	});


});

