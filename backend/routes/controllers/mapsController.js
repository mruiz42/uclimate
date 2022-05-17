const {Client, GeocodeRequest} = require("@googlemaps/google-maps-services-js");
const {handleResponse} = require("../../utils/handleResponse");
const axios = require('axios').default;
const api_key = process.env.GOOGLE_MAPS_API_KEY;


// Google Directions API
// https://developers.google.com/maps/documentation/directions/get-directions
exports.getDirections = (req, res, next) => {
  const origin = req.query.origin;
  const destination = req.query.destination;

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
      handleResponse(req, res, 200, r.data);
    })
    .catch(e => {
      console.log(e);
      handleResponse(req, res, 500);
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
      timeout: 4000 // milliseconds
    }, axios)
      .then(r => {
        handleResponse(req, res, 200, r.data.results);
      })
      .catch(e => {
        console.log(e);
        handleResponse(req, res, 500);
      });
}

// Google Places API
// https://developers.google.com/maps/documentation/places/web-service/autocomplete
exports.queryPlaces = (req, res, next) => {
  const query = req.query.q;
  const lat = req.query.lat;
  const lng = req.query.lng;

  if (!lat || !lng) {
    handleResponse(req, res, 406);
  }

  const client = new Client({});
  client
    .placeQueryAutocomplete({
      params: {
        input: query,
        key: api_key,
        location: lat.toString() + "," + lng.toString(),
        radius: 500
      }
    })
    .then((r) => {
      // TODO: Note that the place ID, used to uniquely identify a place, is exempt from the caching restriction.
      // You can therefore store place ID values indefinitely. The place ID is returned in the place_id field in Places API responses.
      // https://developers.google.com/maps/documentation/places/web-service/policies#usage_limits
      handleResponse(req, res, 200, r.data);
    })
    .catch((e) => {
      console.log(e);
      handleResponse(req, res, 500);
    })
}

exports.getCoordinates = (req, res, next) => {
  const place_id = req.query.place_id;
  const client = new Client({});
  client
    .geocode({
      params: {
        key: api_key,
        place_id: place_id
      },
      timeout: 4000
    })
    .then(r => {

      console.log(r);
      handleResponse(req, res, 200, r.data)
    })
    .catch(e => {
      console.log(e);
      handleResponse(req, res, 500);
    })
}
