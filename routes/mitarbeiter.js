'use strict';

const express = require('express');

// const rootDir = require('../util/path');
const mitarbeiterController = require('../controllers/mitarbeiter');

const router = express.Router();

router.get('/neuer-mitarbeiter', mitarbeiterController.getNeuerMitarbeiter);

router.get('/mitarbeiter', mitarbeiterController.getMitarbeiter);

router.post('/neuer-mitarbeiter', mitarbeiterController.postAddMitarbeiter);

router.post('/mitarbeiter-bearbeiten', mitarbeiterController.postEditMitarbeiter);

router.post('/mitarbeiter-loeschen', mitarbeiterController.postDeleteMitarbeiter);

router.get('/mitarbeiter-bearbeiten/:mitarbeiterId', mitarbeiterController.getEditMitarbeiter);

// router.get('/qualifikationen');

// router.post('/qualifikationen');

module.exports = router;