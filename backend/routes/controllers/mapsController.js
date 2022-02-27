const {Client, GeocodeRequest} = require("@googlemaps/google-maps-services-js");
const axios = require('axios').default;
const api_key = process.env.GOOGLE_MAPS_API_KEY;

// https://developers.google.com/maps/documentation/directions/get-directions
exports.directions = (req, res, next) => {
  const client = new Client({});
  client
    .direction({
      params: {
        // TODO: this
        destination: 1,
        origin: 1,
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

exports.queryPlaces = (req, res, next) => {
  const query = req.query.q;
  const client = new Client({});
  client
    .placeQueryAutocomplete({
      params: {
        input: query,
        key: api_key
      }
    })
    .then((r) => {
      res.send(r.data)
    })
    .catch((e) => {
      res.send("error")
    })
}
