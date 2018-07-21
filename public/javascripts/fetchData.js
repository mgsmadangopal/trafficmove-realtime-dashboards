// Initialize websocket connection
var socket = io.connect('http://localhost:3000');

//-------------------------------------- CHART DEFINITIONS --------------------------------------

// User distribution on map
var domID = 'userMapChart';
var locations = [];
function initMap() {

  var map = new google.maps.Map(document.getElementById(domID), {
    zoom: 10,
    center: {lat: 34.06454, lng: -96.594215},
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  var markers = locations.map(function(location, i) {
    return new google.maps.Marker({
      position: location,
    });
  });
  var markerCluster = new MarkerClusterer(map, markers, {imagePath: '../images/pin'});
  
  
  var circle = new google.maps.Circle({
    	center: {lat: 34.06454, lng: -96.594215},
    	map: map,
    	radius: 30000,          
    	fillColor: '#FF6600',
    	fillOpacity: 0.3,
    	strokeColor: "#FFF",
    	strokeWeight: 2,         
    	editable: true
	});

 	//circle.setMap(map);
}





// vehicle count stacked bar chart
var ecrChart;
var ecrChartData = [
	    {
	        key: 'Route-1',
	        values: []
	    },
	    {
	        key: 'Route-2',
	        values: []
	    },
	    {
	        key: 'Route-3',
	        values: []
	    }
];

nv.addGraph(function() {
        ecrChart = nv.models.multiBarHorizontalChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .duration(500)
            .margin({left: 80})
            .stacked(true);

        ecrChart.yAxis.tickFormat(d3.format(',.2f'));

        ecrChart.yAxis.axisLabel('Number of Vehicles');
        ecrChart.xAxis
        // .axisLabel('X Axis')
        .axisLabelDistance(20);

        d3.select('#ecrChart')
    		.append('svg')
            .datum(ecrChartData)
            .call(ecrChart);

        nv.utils.windowResize(ecrChart.update);

        ecrChart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });
        ecrChart.state.dispatch.on('change', function(state){
            nv.log('state', JSON.stringify(state));
        });
        return ecrChart;
    });

// Vehical Count bar chart
var ecrModalChart;
nv.addGraph(function() {
        ecrModalChart = nv.models.multiBarHorizontalChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .duration(500)
            .margin({left: 80})
            .stacked(true);

        ecrModalChart.yAxis.tickFormat(d3.format(',.2f'));

        ecrModalChart.yAxis.axisLabel('Number of Vehicles');
        ecrModalChart.xAxis.axisLabelDistance(20);

        d3.select('#ecrModalChart')
        	.append('svg')
            .datum(ecrChartData)
            .call(ecrModalChart);

        nv.utils.windowResize(ecrModalChart.update);

        ecrModalChart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });
        ecrModalChart.state.dispatch.on('change', function(state){
            nv.log('state', JSON.stringify(state));
        });
        return ecrModalChart;
    });

var queryLatencyChart;
var queryLatencyChartData = [{key: 'Query Latency',	values: []}];
var count = 1;
nv.addGraph(function() {
	queryLatencyChart = nv.models.lineChart()
	            .margin({left: 100})  //Adjust chart margins to give the x-axis some breathing room.
	            .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
	            .duration(500)  //how fast do you want the lines to transition?
	            .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
	            .showYAxis(true)        //Show the y-axis
	            .showXAxis(true)        //Show the x-axis
	;

	queryLatencyChart.xAxis     //Chart x-axis settings
	  .axisLabel('Count')
	  .tickFormat(d3.format(',.1f'));

	queryLatencyChart.yAxis     //Chart y-axis settings
	  .axisLabel('Time (milliseconds)')
	  .tickFormat(d3.format('.02f'));

	d3.select('#queryLatencyChart')
		.append('svg')    //Select the <svg> element you want to render the chart in.   
		.datum(queryLatencyChartData)         //Populate the <svg> element with chart data...
		.call(queryLatencyChart);          //Finally, render the chart!

	//Update the chart when window resizes.
	nv.utils.windowResize(function() { queryLatencyChart.update() });
	return queryLatencyChart;
});


//------------------------------------- jQuery Definitions -----------------------------------

$(document).ready(function(){

	// modal plugin intialization
	$('.modal-trigger').leanModal();
	
//----------------------------------------User Maps-------------------------------------------
	// Fetch location data for maps
	$("#refreshUserMapData").click(function(){
		updateUserMaps("select lat,lng from poi_traffic;");
	});

	// Launch modal for maps
	$("#launchUserMapModal").click(function(){
		domID = 'userMapsModalChart';
		initMap();
	});

	// Fetch location data for maps modal
	$("#refreshUserMapsModalChart").click(function(){
		updateUserMaps("select lat,lng from poi_traffic;");
	});

	$("#close-user-map").click(function(){
		domID = 'userMapChart';
		initMap();
	});

//-----------------------------------------------Vehicle Count----------------------------------------------
	// Pull data and update ECR bar chart small
	$("#refreshEcrData").click(function(){
		updateEcrChart("select * from window_traffic limit 15;");
	}); 

	// Pull data and update ECR modal bar chart
	$("#refreshEcrModalChart").click(function(){
		updateEcrChart("select * from window_traffic limit 15;");
	});

	// update ECR modal bar chart
	$("#launchEcrModal").click(function(){
		updateEcrChart("select * from window_traffic limit 15;");
	});

}); // Document ready function closing bracket

//----------------------------------------  CHART UPDATE FUCNTIONS ---------------------------------

var updateUserMaps = function(query){
	startTime = Date.now();
	console.log('Sending query to server to update maps: ' + query);
	socket.emit('fetch-latLong', query);	
};

socket.on('fetched-latLongData',function(data){
	locations = data.map(function(elem){
		return { lat: Number(elem.lat), lng: Number(elem.lng)};
	});	
	initMap();
	console.log('Time taken to update userMaps is ${Date.now()-startTime} milliseconds.');
	queryLatencyChartData[0].values.push({x:count++,y:(Date.now()-startTime)});
	queryLatencyChart.update();
});

var updateEcrChart = function(query){
	startTime = Date.now();
	console.log('sending query to update ecrChart server: ' + query);
	socket.emit('fetch-vehicleCountData', query);
};

socket.on('fetched-vehicleCountData',function(data){
	ecrChartData[0].values = data[0];
	ecrChartData[1].values = data[1];
	ecrChartData[2].values = data[2];
	ecrChart.update();
	ecrModalChart.update();
	console.log(`Time taken to update ecrChart is ${Date.now()-startTime} milliseconds.`);
	queryLatencyChartData[0].values.push({x:count++,y:(Date.now()-startTime)});
	queryLatencyChart.update();
});


