const {getDirections, reverseGeocode, queryPlaces, getCoordinates} = require('./controllers/mapsController');
const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.get('/directions', (req, res, next) => {
    getDirections(req, res, next);
})

router.get('/reverseGeocode', (req, res, next) => {
    reverseGeocode(req, res, next);
})

router.get('/queryPlaces', (req, res, next) => {
    queryPlaces(req, res, next);
})

router.get('/coords', (req, res, next) => {
    getCoordinates(req, res, next);
})
module.exports = router;
