'use strict';

const express = require('express');

// const rootDir = require('../util/path');
const kundeController = require('../controllers/kunden');

const router = express.Router();

router.get('/neuer-kunde', kundeController.getKundenAnlegen);

router.get('/kunden-verwalten', kundeController.getKunden);

router.post('/neuer-kunde', kundeController.postKundenAnlegen);

router.post('/kunden-bearbeiten', kundeController.postKundenBearbeiten);

router.post('/kunden-loeschen', kundeController.postDeleteKunden);

//Bearbeitung eines Kunden
router.get('/kunden-verwalten/:kundenId', kundeController.getEditKunde);


module.exports = router;