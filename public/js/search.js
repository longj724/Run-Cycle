const randomLocation = require('random-location');

mapboxgl.accessToken = apiKey.mapBoxKey;

// Creates map and geocoding
var map = new mapboxgl.Map({
    container: 'map', // Container ID
    style: 'mapbox://styles/longj24/ck4z3ai5j084a1cnvlg84jzde', // Map style to use
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
// map.addControl(geocoder);

function assembleDirectionsURL(points) {
    // Make the TomTom API Request
    return 'https://api.tomtom.com/routing/1/calculateRoute/' + points.join(':')  + '/json'
     + '?key=' + apiKey.tomtomKey + '&travelMode=pedestrian&maxAlternatives=5';
}

async function makeNavRequest(coordinates) {
    var response = await fetch(assembleDirectionsURL(coordinates));
    var data = await response.json();
    return data;
}

function filterLocationSearch() {
  var geocoder = document.getElementById('geocoder');
  var location = geocoder.value + '.json'
  var locationList = document.getElementById('potentialLocations');
  clearSearchFilter();
  var response = assembleGeocodeURL(location);
  response.then((data) => {
      for (var i = 0; i < 5; ++i) {
          var placeName = data.features[i].place_name;
          var placeElement = document.createElement('li');
          var placeElementLink = document.createElement('a');

          placeElementLink.innerHTML = placeName;

          placeName = JSON.stringify(placeName);
          placeElementLink.setAttribute('onclick', `fillInSearchBox(${placeName})`);
          placeElement.setAttribute('style', `grid-row-start: ${i + 1}; grid-row-end: ${i + 1};
          justify-self: stretch;`);
          placeElement.appendChild(placeElementLink);
          locationList.appendChild(placeElement);
      }
  })
}

async function assembleGeocodeURL(location) {
  var response = await fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/' + 
  location + '?access_token=' + apiKey.mapBoxKey);
  var data = await response.json();
  return data;
}

function clearSearchFilter() {
  let filterList = document.getElementById('potentialLocations');
  let filterListNodes = document.getElementById('potentialLocations').childNodes;
  while (filterListNodes.length != 0) {
      filterList.removeChild(filterListNodes[0]);
  }
}

function fillInSearchBox(location) {
  var searchBox = document.getElementById('geocoder');
  searchBox.value = location;
  clearSearchFilter();
}

async function getRouteInfo() {
  var geocoder = document.getElementById('geocoder');
  var location = geocoder.value + '.json';
  var distance = document.getElementById('routeDistance');
  var response = await assembleGeocodeURL(location);
  return response;
}

function createRoute() {
  // When there is no route
  var nothing = turf.featureCollection([]);

  var mapA = new mapboxgl.Map({
    container: 'map', // Container ID
    style: 'mapbox://styles/longj24/ck4z3ai5j084a1cnvlg84jzde', // Map style to use
    center: [-122.25948, 37.87221], // Starting position [lng, lat]
    zoom: 12, // Starting zoom level
  });

  var geocodeResponse = getRouteInfo();
  geocodeResponse.then((geocodeData) => {

    var mapA = new mapboxgl.Map({
      container: 'map', // Container ID
      style: 'mapbox://styles/longj24/ck4z3ai5j084a1cnvlg84jzde', // Map style to use
      center: geocodeData.features[0].center, // Starting position [lng, lat]
      zoom: 12, // Starting zoom level
    });

    mapA.on('load', function() {
      mapA.addSource('single-point', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      })

      mapA.addLayer({
        id: 'point',
        source: 'single-point',
        type: 'circle',
        paint: {
          'circle-radius': 10,
          'circle-color': '#448ee4'
        }
      })

      mapA.getSource('single-point').setData({
        "type": "FeatureCollection",
        "features": [{
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "Point",
            "coordinates": geocodeData.features[0].center
          }
        }]
      });

      // Object containing the latitude and longitude at the entered address
      var latLong = {'latitude': geocodeData.features[0].center[1], 'longitude': geocodeData.features[0].center[0]};

      // An array representing the coordinates of the starting point: lng, lat
      var startingPoint = [geocodeData.features[0].center[1], geocodeData.features[0].center[0]];

      // Variables to be used after making the API request
      var routeGeoJSON;
      var potentialRoutePoints = [];

      // Get a random point within the given circumference
      const randomCircumferencePoint = randomLocation.randomCircumferencePoint(latLong, 2414);

      // Add the starting point to the potential route points array and calculate the ending point
      potentialRoutePoints.push(startingPoint);
      var pointToAdd = [randomCircumferencePoint.latitude, randomCircumferencePoint.longitude];
      potentialRoutePoints.push(pointToAdd);

      // Make a request to get the route to the randomly generated point
      var totalRouteDistance = 0;
      var response = makeNavRequest(potentialRoutePoints);
      response.then((data) => {

        // If no route can be found
        if(!data.routes[0]) {
          console.log('No Route of that length found');
        } else {
          
          // Update the total route distance
          totalRouteDistance += data.routes[0].summary.lengthInMeters

          // Get the coordinates that make up the route
          var originalRoutePoints = data.routes[0].legs[0].points;
          var newRoutePoints = []

          // Convert the route coordinates to a 2d array with [lng, lat] elements
          for (var i = 0; i < originalRoutePoints.length; ++i) {
            newRoutePoints[i] = [originalRoutePoints[i].longitude, originalRoutePoints[i].latitude];
          }

          // If a cycle can be made between the starting and ending points
          if (data.routes.length > 1) {

            // Make the request to get the returning route
            potentialRoutePoints.length = 0;
            potentialRoutePoints.push(pointToAdd);
            potentialRoutePoints.push(startingPoint);
            var returnRequest = makeNavRequest(potentialRoutePoints);

            returnRequest.then((returnData) => {

              // Update the total route distance
              totalRouteDistance += returnData.routes[0].summary.lengthInMeters
              console.log('The total route distance is: ', totalRouteDistance);

              originalRoutePoints.length = 0;
              originalRoutePoints = returnData.routes[1].legs[0].points;
              
              var newRoutePointsLength = newRoutePoints.length;

              // Convert the returning route coordinates to a 2d array with [lng, lat] elements
              // Append the returning route coordinates to newRoutePoints array
              for (var i = 0; i < originalRoutePoints.length; ++i) {
                newRoutePoints[newRoutePointsLength + i] = [originalRoutePoints[i].longitude, originalRoutePoints[i].latitude];
              }

              // Create the geometry to plot the route
              var geometryObject = {'coordinates': newRoutePoints, 'type': 'LineString'};

              routeGeoJSON = turf.featureCollection([turf.feature(geometryObject)]);

              // Update the `route` source by getting the route source
              // and setting the data equal to routeGeoJSON
              mapA.getSource('route').setData(routeGeoJSON);
            })
          } else {
            // If a cycle cannot be made - the route will now be an out and back
            console.log('one route, the distance is: ', data.routes[0].summary.lengthInMeters);

            // The route points as latitude longitude objects
            var originalRoutePoints = data.routes[0].legs[0].points;
            var newRoutePoints = []

            // Convert the route points to a 2d array with [lng, lat] elements
            for (var i = 0; i < originalRoutePoints.length; ++i) {
              newRoutePoints[i] = [originalRoutePoints[i].longitude, originalRoutePoints[i].latitude];
            }

            var geometryObject = {'coordinates': newRoutePoints, 'type': 'LineString'};

            routeGeoJSON = turf.featureCollection([turf.feature(geometryObject)]);

            mapA.getSource('route').setData(routeGeoJSON);
          }
        }
      })
      // Clearing potentialRoutePoints so new routes can be created
      potentialRoutePoints.length = 0;

      mapA.addSource('route', {
        type: 'geojson',
        data: nothing
      })

      mapA.addLayer({
          id: 'routeline-active',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#F93800',
            'line-width': [
              "interpolate",
              ["linear"],
              ["zoom"],
              12, 3,
              22, 12
            ]
          }
        }, 'waterway-label');

      mapA.addLayer({
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
    })
  })
}

var createRouteBtn = document.getElementById('makeRoute');
createRouteBtn.addEventListener('click', createRoute);