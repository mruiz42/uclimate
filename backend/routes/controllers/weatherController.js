const token = process.env.NOAA_API_TOKEN
const axios = require('axios').default;

// https://www.weather.gov/documentation/services-web-api
// https://www.ncdc.noaa.gov/cdo-web/api/v2/

// https://api.weather.gov/gridpoints/HNX/74,62/forecast
// https://api.weather.gov/points/3(6,-119




exports.getForecast = (req, res) => {
  const lat = req.query.lat;
  const lng = req.query.lng;
  const points_baseUrl = "https://api.weather.gov/points";
  const gridpoints_baseUrl = "https://api.weather.gov/gridpoints";
  // TODO: Sanitize lat&lng params
  // Cache station data using coordinates as key using redis or similar
  // returns the response or error
  axios.get( points_baseUrl + "/" + lat + "," + lng, {})
    .then(points_res => {
      console.log(points_res.data);
      const office = points_res.data.properties.gridId;
      const gridX = points_res.data.properties.gridX;
      const gridY = points_res.data.properties.gridY;
      axios.get( gridpoints_baseUrl + "/" + office + "/" + gridX + "," + gridY + "/" + "forecast")
        .then(forecast_res => {
          console.log(forecast_res);
          res.send(forecast_res.data);
        })
        .catch(e => {
          console.log(e);
          res.send(e);
        })
    })
    .catch(e => {
      console.log(e);
      res.send(e);
    })}

