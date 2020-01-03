const randomLocation = require('random-location');

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
        if (count == 1) {
            return generateRandomPoint(center, radius);
        }

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
    var x0 = center.lat
    var y0 = center.lng;

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
var potentialRoutePoints = [];

var map = new mapboxgl.Map({
    container: 'map', // Container ID
    style: 'mapbox://styles/mapbox/streets-v11', // Map style to use
    center: [-122.25948, 37.87221], // Starting position [lng, lat]
    zoom: 12, // Starting zoom level
});

var geocoder = new MapboxGeocoder({ // Initialize the geocoder
    accessToken: apiKey.mapBoxKey, // Set the access token
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
    //   var latLong = {'lng': e.result.center[0], 'lat': e.result.center[1]};
      var startingPoint = [e.result.center[0], e.result.center[1]];
      potentialRoutePoints.unshift(startingPoint);

      const randomCircumferencePoint = randomLocation.randomCircumferencePoint(startingPoint, 5000);
      console.log('The random point is: ', randomCircumferencePoint);
    //   var lngLat = {'lng': potentialRoutePoints[potentialRoutePoints.length - 1][0],
    //             'lat': potentialRoutePoints[potentialRoutePoints.length - 1][1]};

    //   var randomPoint = generateRandomPoints(lngLat, 500, 1);
    //   potentialRoutePoints.push(randomPoint);

    //   var distance = 0;
    //   var response;
    //   var foundRoute = false;
    //   var pointRadius = 2500;

    //   while (potentialRoutePoints.length < 12) {
    //       var lngLat = {'lng': potentialRoutePoints[potentialRoutePoints.length - 1][0],
    //             'lat': potentialRoutePoints[potentialRoutePoints.length - 1][1]}

    //       var randomPoint = generateRandomPoints(lngLat, pointRadius, 1);
    //       potentialRoutePoints.push(randomPoint);
    //       response = makeRequest(potentialRoutePoints);
    //       response.then((data) => {
    //         console.log('The data is: ', data);

    //         if (data.trips[0].distance >= 4500 && data.trips[0].distance <= 5500) {
    //             // With Optimization Call
    //             var routeGeoJSON = turf.featureCollection([turf.feature(data.trips[0].geometry)]);
    //             console.log(data.trips[0].distance);
    //             // Update the 'route' source by getting the route source
    //             // and setting the data equal to routeGeoJSON
    //             map.getSource('route').setData(routeGeoJSON);
    //             foundRoute = true;
    //             distance = data.trips[0].distance;
    //             console.log('Found Route is: ', foundRoute);
    //         }
    //         if (data.trips[0].distance <= 5000) {
    //             console.log('Points Radius is: ', pointRadius);
    //             pointRadius += 1000;
    //         }
    //       });

    //       if (distance >= 4500 && distance <= 5500) {
    //           console.log('Should stop generating route now');
    //           break; 
    //     }
    //   }

    //   potentialRoutePoints.length = 0;
    //   potentialRoutePoints = generateRandomPoints(latLong, 5000, 11);
    //   potentialRoutePoints.unshift(startingPoint);
    //   makeRequest(potentialRoutePoints);
    //   potentialRoutePoints = snapCoordinates(potentialRoutePoints);
    //   potentialRoutePoints.then((response) => {
    //     makeRequest(response);
    //   })

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

function assembleMatrixURL(points) {
    return 'https://api.mapbox.com/directions-matrix/v1/mapbox/driving/' + points.join(';') + 
    '?annotations=distance&access_token=' + apiKey.mapBoxKey;
}

function assembleOptURL(points) {
    return 'https://api.mapbox.com/optimized-trips/v1/mapbox/driving/' + points.join(';') +
    '?geometries=geojson&overview=full&roundtrip=true&access_token='+ apiKey.mapBoxKey;
}

async function makeRequest(coordinates) {
    var noRoute = turf.featureCollection([]);

    var response = await fetch(assembleOptURL(coordinates));
    var data = await response.json();
    return data;

        // var bestPath = [];
        // var marked = []
        // var currentPath = [];
        // var cycleLength = 5000;

        // for (var i = 0; i < coordinates.length; ++i) {
        //     marked[i] = false;
        // }

        // // Pushing the index that corresponds to the coordinates of the starting point
        // currentPath.push(0);

        // genPerms(response.distances, marked, cycleLength, 0, 0, 0, currentPath, bestPath, coordinates.length);
        // console.log(bestPath);

        // // Putting the bestPath coordinates into an array
        // var bestPathCoordinates = [];
        // for (var i = 0; i < bestPath.length; ++i) {
        //     bestPathCoordinates[i] = coordinates[bestPath[i]];
        // }

        // if (bestPathCoordinates.length == 0) {
        //     console.log('No best path found');
        //     return;
        // }

        // Make a call to the Optimization API
        // fetch(assembleOptURL(bestPathCoordinates))
        // .then((responseOpt) => {
        //     return responseOpt.json();
        // }).then((responseOpt) => {
        //     console.log(responseOpt);
        //     // With Optimization Call
        //     var routeGeoJSON = turf.featureCollection([turf.feature(responseOpt.trips[0].geometry)]);
        //     console.log(responseOpt.trips[0].distance);

        //     // With Matching Call
        //     // var routeGeoJSON = turf.featureCollection([turf.feature(responseOpt.matchings[0].geometry)]);
        //     // console.log('The distance is: ', responseOpt.matchings[0].distance);

        //     // Update the 'route' source by getting the route source
        //     // and setting the data equal to routeGeoJSON
        //     map.getSource('route').setData(routeGeoJSON);
        // }).catch((optError) => {
        //     console.log('Error with the opt call');
        // })
    // }).catch((matrixError) => {
    //     console.log('Error with the matrix call');
    //     return 0;
    // })
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
    start, pathLength, currentPath, bestPath, maxLength) {
        pathLength += graph[currentVert][start];

        if ((pathLength >= distance - 160) && (pathLength <= distance + 160)) {
            bestPath.length = 0;
            for (var i = 0; i < currentPath.length; ++i) {
                bestPath[i] = currentPath[i];
            }
            pathLength -= graph[currentVert][start];
            return;
        }
        pathLength -= graph[currentVert][start];

        if (!promising(distance, pathLength)) {
            return;
        }

        for (var i  = currentVert; i < maxLength; ++i) {
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

// Snap Coordinates to the nearest road
async function snapCoordinates(coordinates) {
    var newCoordinates = [];

    // Swap lat and lng in coordinates
    for (var i = 0; i < coordinates.length; ++i) {
        var temp = coordinates[i][0];
        coordinates[i][0] = coordinates[i][1];
        coordinates[i][1] = temp;
    }
    
    var sortedCoords = coordinates.slice(1, 20).sort()
    sortedCoords.unshift(coordinates[0]);

    try {
        var response = await fetch('https://roads.googleapis.com/v1/snapToRoads?path=' + sortedCoords.join('|') 
        + '&key=' + apiKey.googleKey)

        var data = await response.json();

        console.log('The data is: ', data);
        var lat;
        var lng;

        for (var i = 0; i < data.snappedPoints.length; ++i) {
            lat = data.snappedPoints[i].location.latitude;
            lng = data.snappedPoints[i].location.longitude;
            newCoordinates.push([lng, lat]);
        }
        return newCoordinates;
    } catch {
        console.log('Error with the snap to roads call')
    }  
}