const {getDirections, reverseGeocode, queryPlaces} = require('./controllers/mapsController');
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

module.exports = router;
