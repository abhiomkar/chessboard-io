var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/machines', function(req, res) {
  var machines = [
    {hostname: 'jnaapti.com', ip: '1.2.3.4'},
    {hostname: 'vc.jnaapti.com', ip: '4.2.3.5'},
  ];
  res.set('Content-type', 'application/json');
  res.send(JSON.stringify(machines));
});

module.exports = router;
