const token = process.env.NOAA_API_TOKEN
const axios = require('axios').default;

// https://www.weather.gov/documentation/services-web-api
// https://www.ncdc.noaa.gov/cdo-web/api/v2/

// https://api.weather.gov/gridpoints/HNX/74,62/forecast
// https://api.weather.gov/points/36,-119


exports.getForecast = (req, res) => {
  const lat = req.query.lat;
  const lng = req.query.lng;
  const url = "";
  // TODO: Sanitize lat&lng params
  // Cache station data using coordinates as key using redis or similar
  axios.get("https://api.weather.gov/points/" + lat + "," + lng, {})
    .then(r => {
      console.log(r);
      res.send(r.data);
    })
    .catch(e => {
      console.log(e);
  })
}

exports.getPoint = (req, res) => {


}
