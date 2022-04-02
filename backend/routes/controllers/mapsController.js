const {Client, GeocodeRequest} = require("@googlemaps/google-maps-services-js");
const axios = require('axios').default;
const api_key = process.env.GOOGLE_MAPS_API_KEY;


// Google Directions API
// https://developers.google.com/maps/documentation/directions/get-directions
exports.directions = (req, res, next) => {
  const origin = req.query.origin;
  const destination = req.query.destination;
  // concert text form to placeid
  const client = new Client({});
  client
    .directions({
      params: {
        origin: origin,
        destination: destination,
        key: api_key,
        travelMode: "DRIVING"
      },
      timeout: 1000 // milliseconds
    }, axios)
    .then(r => {
      res.send(r.data.results)
    })
    .catch(e => {
      console.log(e);
      res.send("error")
    });
}

exports.reverseGeocode = (req, res, next) => {
  const coords = req.query.latlng;
  const client = new Client({});
  client
    .geocode({
      params: {
        latlng: coords,
        key: api_key
      },
      timeout: 1000 // milliseconds
    }, axios)
      .then(r => {
        res.send(r.data.results)
      })
      .catch(e => {
        console.log(e);
        res.send("error")
      });
}

// Google Places API
// https://developers.google.com/maps/documentation/places/web-service
exports.queryPlaces = (req, res, next) => {
  const query = req.query.q;
  const lat = req.query.lat;
  const lng = req.query.lng;
  let params = {
    input: query,
    key: api_key
  }

  if (!lat || !lng) {
    res.send()
  }
  params.location = lat.toString() + "," + lng.toString();
  params.radius = 500;

  const client = new Client({});
  client
    .placeQueryAutocomplete({
      params: params
    })
    .then((r) => {
      res.send(r.data)
    })
    .catch((e) => {
      res.send("error")
    })
}
