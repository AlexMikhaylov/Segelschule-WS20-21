'use strict';

const express = require('express');

// const rootDir = require('../util/path');
const kurseController = require('../controllers/kurse');

const router = express.Router();

router.get('/kurse-verwalten', kurseController.getKurse);

router.get('/neuer-kurs', kurseController.getNeuerKurs);

router.get('/kursplan', kurseController.getKursplan);

router.get('/neuer-termin', kurseController.getNeuerTermin);

router.post('/neuer-termin', kurseController.postNeuerTermin);

router.post('/neuer-kurs', kurseController.postAddKurs);

router.post('/kurs-bearbeiten', kurseController.postEditKurs);

router.post('/kurs-loeschen', kurseController.postDeleteKurs);

router.post('/neue-buchung', kurseController.postNeueBuchung);

router.get('/buchungen', kurseController.getBuchungen);

router.post('/buchung-bearbeiten', kurseController.postEditBuchung);

router.post('/buchung-stornieren', kurseController.postDeleteBuchung);

router.get('/pdf-download/:buchungId', kurseController.getPrintPdf);

router.get('/kursplan-buchen/:kursplanId', kurseController.getKursplanBuchen);

router.post('/kursplan-loeschen', kurseController.postDeleteKursplan);

router.get('/kursplan-bearbeiten/:kursplanId', kurseController.getEditKursplan);

router.post('/kursplan-bearbeiten', kurseController.postEditKursplan);

router.get('/kurs-bearbeiten/:kursId', kurseController.getEditKurs);

router.get('/buchung-bearbeiten/:buchungId', kurseController.getEditBuchung);

module.exports = router;