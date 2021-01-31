'use strict';

const express = require('express');

// const rootDir = require('../util/path');
const dashboardController = require('../controllers/dashboard');

const router = express.Router();

router.get('/', dashboardController.getDashboard);


module.exports = router;