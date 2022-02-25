const {getDirections} = require('./controllers/navigatorController');
const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.get('/directions', (req, res, next) => {
    getDirections(req, res, next);
})

module.exports = router;
