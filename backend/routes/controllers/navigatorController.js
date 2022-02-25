const {Client} = require("@googlemaps/google-maps-services-js");
const axios = require('axios').default;

exports.getDirections = (req, res, next) => {
    const client = new Client({});
    client
        .elevation({
            params: {
                locations: [{ lat: 45, lng: -110 }],
                key: process.env.GOOGLE_MAPS_API_KEY
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