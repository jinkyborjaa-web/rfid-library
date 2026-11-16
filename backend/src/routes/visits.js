const express = require('express');
const checkInController = require('../controllers/checkInController');

const router = express.Router();

router.get('/', checkInController.getVisitLog);

module.exports = router;
