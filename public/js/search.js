/**
* Generates number of random geolocation points given a center and a radius.
* @param  {Object} center A JS object with lat and lng attributes.
* @param  {number} radius Radius in meters.
* @param {number} count Number of points to generate.
* @return {array} Array of arrays with lat and lng attributes.
*/

function generateRandomPoints(center, radius, count) { 
    var points = [];

    for (var i = 0; i < count; ++i) {
        points.push(generateRandomPoint(center, radius));
    }
    return points;
}

/**
* Generates number of random geolocation points given a center and a radius.
* @param  {Object} center A JS object with lat and lng attributes.
* @param  {number} radius Radius in meters.
* @return {array} The generated random points as an array with lat and lng.
*/

function generateRandomPoint(center, radius) {
    var x0 = center.lng
    var y0 = center.lat;

    // Convert Radius from meter to degrees
    var rd = radius / 1113000;

    var u = Math.random();
    var v = Math.random();

    var w = rd * Math.sqrt(u);
    var t = 2 * Math.PI * v;
    var x = w * Math.cos(t);
    var y = w * Math.sin(t);

    var coordinates = [y + y0, x + x0];

    return coordinates;
}

// Creates map and geocoding
mapboxgl.accessToken = 'pk.eyJ1IjoibG9uZ2oyNCIsImEiOiJjanlmM29uMnQwMHpuM25wYTRrNXVlNGg0In0.e22c1LT7Rl9FHcpLu7nGvQ';
var potentialRoutePoints = [];

var map = new mapboxgl.Map({
    container: 'map', // Container ID
    style: 'mapbox://styles/mapbox/streets-v11', // Map style to use
    center: [-122.25948, 37.87221], // Starting position [lng, lat]
    zoom: 12, // Starting zoom level
});

var geocoder = new MapboxGeocoder({ // Initialize the geocoder
    accessToken: mapboxgl.accessToken, // Set the access token
    mapboxgl: mapboxgl, // Set the mapbox-gl instance
    marker: false,
    placeholder: 'Enter Starting Location'
});
  
// Add the geocoder to the map
map.addControl(geocoder);

// After the map style has loaded on the page,
// add a source layer and default styling for a single point
map.on('load', function() {
    map.addSource('single-point', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  
    map.addLayer({
      id: 'point',
      source: 'single-point',
      type: 'circle',
      paint: {
        'circle-radius': 10,
        'circle-color': '#448ee4'
      }
    });
  
    // Listen for the `result` event from the Geocoder
    // `result` event is triggered when a user makes a selection
    //  Add a marker at the result's coordinates
    geocoder.on('result', function(e) {
      map.getSource('single-point').setData(e.result.geometry);
      var latLong = {'lat': e.result.center[0], 'lng': e.result.center[1]};
      var startingPoint = [e.result.center[0], e.result.center[1]];

      potentialRoutePoints = generateRandomPoints(latLong, 5000, 14);
      potentialRoutePoints.unshift(startingPoint);
      makeRequest();
    });

    map.addSource('route', {
        type: 'geojson',
        data: nothing
    })
    
    map.addLayer({
        id: 'routeline-active',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3887be',
          'line-width': [
            "interpolate",
            ["linear"],
            ["zoom"],
            12, 3,
            22, 12
          ]
        }
      }, 'waterway-label');
    
    map.addLayer({
    id: 'routearrows',
    type: 'symbol',
    source: 'route',
    layout: {
        'symbol-placement': 'line',
        'text-field': '▶',
        'text-size': [
        "interpolate",
        ["linear"],
        ["zoom"],
        12, 24,
        22, 60
        ],
        'symbol-spacing': [
        "interpolate",
        ["linear"],
        ["zoom"],
        12, 30,
        22, 160
        ],
        'text-keep-upright': false
    },
    paint: {
        'text-color': '#3887be',
        'text-halo-color': 'hsl(55, 11%, 96%)',
        'text-halo-width': 3
    }
    }, 'waterway-label');
});

// Generating the route - 5 miles for now
var nothing = turf.featureCollection([]);

function assembleMatrixURL() {
    return 'https://api.mapbox.com/directions-matrix/v1/mapbox/driving/' + potentialRoutePoints.join(';') + 
    '?annotations=distance&access_token=' + mapboxgl.accessToken;
}

function assembleOptURL(points) {
    return 'https://api.mapbox.com/optimized-trips/v1/mapbox/driving/' + points.join(';') +
     '?geometries=geojson&overview=full&roundtrip=true&access_token='+ mapboxgl.accessToken;
}

function makeRequest() {
    var noRoute = turf.featureCollection([]);

    fetch(assembleMatrixURL())
    .then((response) => {
        return response.json();
    }).then((response) => {
        console.log(response);
        var bestPath = [];
        var marked = []
        var currentPath = [];
        var cycleLength = 5000;

        for (var i = 0; i < 15; ++i) {
            marked[i] = false;
        }

        // Pushing the index that corresponds to the coordinates of the starting point
        currentPath.push(0);

        genPerms(response.distances, marked, cycleLength, 0, 0, 0, currentPath, bestPath);
        console.log(bestPath);

        // Putting the bestPath coordinates into an array
        var bestPathCoordinates = [];
        for (var i = 0; i < bestPath.length; ++i) {
            bestPathCoordinates[i] = potentialRoutePoints[bestPath[i]];
        }
        console.log(bestPathCoordinates);
        // Make a call to the Optimization API
        fetch(assembleOptURL(bestPathCoordinates))
        .then((responseOpt) => {
            return responseOpt.json();
        }).then((responseOpt) => {
            // Create a GeoJSON feature collection
            var routeGeoJSON = turf.featureCollection([turf.feature(responseOpt.trips[0].geometry)]);
            console.log(responseOpt.trips[0].distance);

            if (!responseOpt.trips[0]) {
                routeGeoJSON = noRoute;
            } else {
                // Update the 'route' source by getting the route source
                // and setting the data equal to routeGeoJSON
                map.getSource('route').setData(routeGeoJSON);
            }
        }).catch((optError) => {
            console.log('Error with the opt call');
        })

        //     if (bestPath.length == 0) {
        //         console.log('In the if statement')
        //         routeGeoJSON2 = noRoute;
        //     } else {
        //         console.log('In the else statement');
        //     }
        // }).catch((error2) => {
        //     console.log('Error with the matrix request');
        // })
    }).catch((matrixError) => {
        console.log('Error with the matrix call');
    })
}

/**
 * Determines if a route is promising
 * @param {number} distance 
 * @param {number} pathLength 
 * @returns {boolean} Signifies if the route is promising
 */
function promising(distance, pathLength) {
    if (pathLength > distance) {
        return false;
    }
    return true;
}

/**
 * Generates all possible routes and searches for a cycle of the given distance
 * @param {array} graph 
 * @param {array} marked 
 * @param {number} distance 
 * @param {number} currentVert 
 * @param {number} start 
 * @param {number} pathLength 
 * @param {array} currentPath 
 * @param {array} bestPath 
 */
var thing = true;
function genPerms(graph, marked, distance, currentVert, 
    start, pathLength, currentPath, bestPath) {
        pathLength += graph[currentVert][start];

        if ((pathLength >= distance - 160) && (pathLength <= distance + 160)) {
            bestPath.length = 0;
            for (var i = 0; i < currentPath.length; ++i) {
                bestPath[i] = currentPath[i];
            }
            return;
        }
        pathLength -= graph[currentVert][start];

        if (!promising(distance, pathLength)) {
            return;
        }

        for (var i  = currentVert; i < 15; ++i) {
            if ((i == 0 && currentVert == 0) || marked[i] || graph[currentVert][i] == 0) {
                continue;
            }

            pathLength += graph[currentVert][i];
            currentPath.push(i);
            marked[i] = true;
            genPerms(graph, marked, distance, i, start, pathLength, currentPath, bestPath);
            marked[i] = false;
            currentPath.pop();
            pathLength -= graph[currentVert][i];
        }
}
