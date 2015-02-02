/**
 * Created by frank on 1/31/15.
 */
var express = require('express');
var router = express.Router();


/* GET home page. */
router.post('/games', function(req, res, next) {
    res.render('', { title: 'Express' });
});

module.exports = router;
