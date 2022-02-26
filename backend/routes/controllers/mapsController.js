const {Client} = require("@googlemaps/google-maps-services-js");
const axios = require('axios').default;
const api_key = process.env.GOOGLE_MAPS_API_KEY;

// https://developers.google.com/maps/documentation/directions/get-directions
exports.getDirections = (req, res, next) => {
    const client = new Client({});
    client
        .direction({
            params: {
                destination: []
                origin: [{ lat: 45, lng: -110 }],
                key: api_key
            },
            timeout: 1000 // milliseconds
        }, axios)
        .then(r => {
            console.log(r.data.results[0].elevation);
            res.send(r.data.results)
        })
        .catch(e => {
            console.log(e);
            res.send(e)
        });
}