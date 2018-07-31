// Initialize websocket connection
var socket = io.connect('http://localhost:3000');

// Create charts

// Bounce Rate Line Chart

var bounceRateLineChart; 
var bounceRateLineChartData = [
    {
      values: [],      //values - represents the array of {x,y} data points
      key: 'Vehical Spead', //key  - the name of the series.
      color: '#7cb342'  //color - optional: choose your own line color.
    }
    ];

nv.addGraph(function(){
    bounceRateLineChart = nv.models.lineChart()
                  .margin({left: 50, right: 30})
                  .useInteractiveGuideline(true)
                  .showLegend(true)
                  .showYAxis(true)
                  .showXAxis(true);

    bounceRateLineChart.xAxis
            .axisLabel('Time')
            .tickFormat(function(d){return d3.time.format('%H:%M:%S')(new Date(d));});

    bounceRateLineChart.yAxis
            .axisLabel('Bounce Rate')
            .tickFormat(d3.format('.2f'));

    d3.select('#bounceRate')
        .append('svg')
        .datum(bounceRateLineChartData)
        .transition().duration(500)
        .call(bounceRateLineChart);

    nv.utils.windowResize(function() { bounceRateLineChart.update(); });
    return bounceRateLineChart;
});

// Fuel Level chart
var avgTimeSpentLineChart;
var avgTimeSpentLineChartData = [
    {
      values: [],      //values - represents the array of {x,y} data points
      key: 'Vehical Fuel', //key  - the name of the series.
      color: '#ff7f0e'  //color - optional: choose your own line color.
    }
    ];

nv.addGraph(function(){
    avgTimeSpentLineChart = nv.models.lineChart()
                  .margin({left: 50, right: 20})
                  .useInteractiveGuideline(true)
                  .showLegend(true);

    avgTimeSpentLineChart.xAxis
            .axisLabel('Time')
            .tickFormat(function(d){return d3.time.format('%H:%M:%S')(new Date(d));});

    avgTimeSpentLineChart.yAxis
            .axisLabel('Avg. Time Spent (min)')
            .tickFormat(d3.format('.2f'));

    
    d3.select('#avgTimeSpent')
        .append('svg')
        .datum(avgTimeSpentLineChartData)
        .transition().duration(500)
        .call(avgTimeSpentLineChart);

    nv.utils.windowResize(function() { avgTimeSpentLineChart.update(); });
    return avgTimeSpentLineChart;
});



//--------------------------------------Socket.io event handlers------------------------------------

// Bounce Rate Chart
socket.on('traffic-data-input', function (data) {	
	bounceRateLineChartData[0].values.push({x: Date.now(), y: Number(data.speed)});
	console.log(data);
	//alert(data);
	if(bounceRateLineChartData[0].values.length > 30) {
		bounceRateLineChartData[0].values.shift();
	}
	bounceRateLineChart.update();
});

//Avg. Time spent line chart
socket.on('traffic-data-input', function (data) {
	avgTimeSpentLineChartData[0].values.push({x: Date.now(), y: Number(data.fuelLevel)});
	if(avgTimeSpentLineChartData[0].values.length > 30) {
		avgTimeSpentLineChartData[0].values.shift();
	}
	avgTimeSpentLineChart.update();
});

