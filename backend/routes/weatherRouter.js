const express = require('express');
const router = express.Router();
const {getForecast} = require('./controllers/weatherController');


/* GET users listing. */
router.get('/forecast', (req, res, next) => {
    getForecast(req, res);
});

module.exports = router;
