'use strict';

const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Op = Sequelize.Op;

const Kunde = require('../models/Kunde');
const Buchung = require('../models/Buchung');
const Kurs = require('../models/Kurs');
const Mitarbeiter = require('../models/Mitarbeiter');
const Kursplan = require('../models/Kursplan');



exports.getDashboard = async (req, res, next) => {
    const param = {
        distinct: true,
        col: 'id'
    }

    const eingesch = {
        col: 'eingeschrieben'
    }

    const kunden = await Kunde.count(param);
    const kurse = await Kurs.count(param);
    const buchungen = await Buchung.count(param);
    const mitarbeiter = await Mitarbeiter.count(param);

    const kursplan = await Kursplan.sum('eingeschrieben');
    const kurseImKursplan = await Kursplan.findAll({
        include: [Kurs]
    });

    let kursMaxKp = 0;
    kurseImKursplan.forEach(kurs => {
        kursMaxKp += kurs.Kur.maxTeilnehmer;
        
    });

    kursMaxKp -= kursplan;

    // res.json(kursMaxKp);

    console.log(kursMaxKp, kursplan);

    res.render('admin-theme/dashboard', {
        pageTitle: 'Dashboard',
        path: '/',
        kunden: kunden,
        kurse: kurse,
        buchungen: buchungen,
        mitarbeiter: mitarbeiter,
        kursplan: kursplan,
        kursMax: kursMaxKp
    })
}