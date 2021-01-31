'use strict';

const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Op = Sequelize.Op;

const Adresse = require('../models/Adresse');
const Mitarbeiter = require('../models/Mitarbeiter');
const Kursplan = require('../models/Kursplan');
const Kurs = require('../models/Kurs');

const image_format = ['image/png', 'image/jpg', 'image/jpeg'];

let fetchedMa;
let fetchedAdresse;

exports.getNeuerMitarbeiter = (req, res, next) => {
    res.render('admin-theme/neuer-mitarbeiter', {
        pageTitle: 'Neuer Mitarbeiter',
        path: '/neuer-mitarbeiter',
        editing: false

    });
}

exports.getMitarbeiter = (req, res, next) => {

    Mitarbeiter.findAll({
        include: Adresse
    })
        .then(mitarbeiter => {
            // console.log(mitarbeiter);
            res.render('admin-theme/mitarbeiter', {
                mitarbeiter: mitarbeiter,
                pageTitle: 'Mitarbeiter',
                path: '/mitarbeiter',
                editing: false
            });
        }).catch(err => {
            console.log(err);
            req.flash('error', 'Mitarbeiter.findAll() Daten konnten nicht geladen werden');
            return res.redirect('/404');

        });
}


exports.postAddMitarbeiter = (req, res, next) => {

    const eingabenMa = {
        anrede: req.body.anrede.trim(),
        vorname: req.body.vorname.trim(),
        nachname: req.body.nachname.trim(),
        email: req.body.email.trim(),
        honorar: req.body.honorar.trim(),
        telefon: req.body.telefon.trim(),
        geburtsdatum: req.body.geburtsdatum.trim(),
        qualifikationen: req.body.qualifikationen.trim(),
        bewertung: null,
        profilbild: null,

        // adresse
        plz: req.body.plz.trim(),
        ort: req.body.ort.trim(),
        strasse: req.body.strasse.trim(),
        land: req.body.land.trim()
    }



    if (req.files) {
        const bildData = req.files.profilbild;


        if (image_format.includes(bildData.mimetype)) {
            bildData.mv('./public/uploads/' + bildData.name);
            eingabenMa.profilbild = '/uploads/' + bildData.name;
        } else {
            req.flash('error', 'Ungültiges Bild-Format. Bitte wählen Sie eine jpg, jpeg oder png Datei');
            return res.redirect('/neuer-mitarbeiter');

        }
    }


    if (!eingabenMa.geburtsdatum) {
        eingabenMa.geburtsdatum = null;
    }

    if (!eingabenMa.telefon) {
        eingabenMa.telefon = null;
    }


    if (!eingabenMa.email) {
        eingabenMa.email = null;
    }

    if (!eingabenMa.qualifikationen) {
        eingabenMa.qualifikationen = null;
    }



    Mitarbeiter.create({
        anrede: eingabenMa.anrede,
        vorname: eingabenMa.vorname,
        nachname: eingabenMa.nachname,
        email: eingabenMa.email,
        honorar: eingabenMa.honorar,
        telefon: eingabenMa.telefon,
        geburtsdatum: eingabenMa.geburtsdatum,
        profilbild: eingabenMa.profilbild,
        bewertung: eingabenMa.bewertung,
        qualifikationen: eingabenMa.qualifikationen

    })
        .then((mitarbeiter) => {
            // console.log('Created Product')
            return mitarbeiter.createAdresse(
                {
                    plz: eingabenMa.plz,
                    ort: eingabenMa.ort,
                    strasse: eingabenMa.strasse,
                    land: eingabenMa.land
                })
                .then(() => {
                    req.flash('erfolg', 'Mitarbeiter wurde erfolgreich angelegt');
                    return res.redirect('/mitarbeiter');
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error', 'mitarbeiter.createAdresse() Fehler bei der Erstellung des Kunden');
                    return res.render('admin-theme/neuer-mitarbeiter', {
                        pageTitle: 'Neuer Mitarbeiter',
                        ma: eingabenMa,
                        path: '/neuer-mitarbeiter',
                        editing: true
                    });
                })

        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Mitarbeiter.create() Fehler bei der Erstellung des Kunden');
            return res.render('admin-theme/neuer-mitarbeiter', {
                pageTitle: 'Neuer Mitarbeiter',
                ma: eingabenMa,
                path: '/neuer-mitarbeiter',
                editing: true
            });
        });
}

exports.getEditMitarbeiter = async (req, res, next) => {

    //checking for the query parameters in the url: if the param "edit" is set to "true"
    const editMode = req.query.edit; //extracting
    let adresse;

    if (editMode !== 'true') {
        req.flash('error', 'getEditMitarbeiter: Fehler beim Aufruf des Links');
        return res.redirect('/mitarbeiter');
    }

    const maId = req.params.mitarbeiterId;

    try {
        fetchedMa = await
            Mitarbeiter.findOne({
                where: {
                    id: {
                        [Op.eq]: maId
                    }
                }
            });

        if (!fetchedMa) {

            req.flash('error', 'findOne() by Id Mitarbeiter wurde nicht gefunden');
            return res.redirect('/mitarbeiter');
        }

        let fetchedAdresse = await fetchedMa.getAdresses();

        let updatedMa = Object.assign(fetchedMa, {
            plz: fetchedAdresse[0].plz,
            ort: fetchedAdresse[0].ort,
            strasse: fetchedAdresse[0].strasse,
            land: fetchedAdresse[0].land
        });
        // console.log(updatedKunde);

        return res.render('admin-theme/neuer-mitarbeiter', {
            pageTitle: 'Mitarbeiter bearbeiten',
            path: '/mitarbeiter',
            editing: editMode,
            ma: updatedMa
        });
    } catch (error) {
        console.log(error);
        req.flash('error', 'findOne() Mitarbeiter wurde nicht gefunden');
        return res.redirect('/mitarbeiter');
    }
}

exports.postEditMitarbeiter = async (req, res, next) => {
    const maId = req.body.maId;
    const mitarbeiter = await Mitarbeiter.findByPk(maId);

    const eingabenMa = {
        id: maId,
        anrede: req.body.anrede.trim(),
        vorname: req.body.vorname.trim(),
        nachname: req.body.nachname.trim(),
        email: req.body.email.trim(),
        honorar: req.body.honorar.trim(),
        telefon: req.body.telefon.trim(),
        geburtsdatum: req.body.geburtsdatum.trim(),
        qualifikationen: req.body.qualifikationen.trim(),
        bewertung: mitarbeiter.bewertung,
        profilbild: mitarbeiter.profilbild,

        // adresse
        plz: req.body.plz.trim(),
        ort: req.body.ort.trim(),
        strasse: req.body.strasse.trim(),
        land: req.body.land.trim()
    }

    if (req.body.deleteBildma) {
        eingabenMa.profilbild = null;
    }


    if (req.files) {
        const bildData = req.files.profilbild;


        if (image_format.includes(bildData.mimetype)) {

            bildData.mv('./public/uploads/' + bildData.name);
            eingabenMa.profilbild = '/uploads/' + bildData.name;

        } else {
            req.flash('error', 'Ungültiges Bild-Format. Bitte wählen Sie eine jpg, jpeg oder png Datei');
            return res.render('admin-theme/neuer-kunde', {
                pageTitle: 'Mitarbeiter bearbeiten',
                ma: eingabenMa,
                path: '/neuer-mitarbeiter',
                editing: true
            })
        }
    }

    if (!eingabenMa.geburtsdatum) {
        eingabenMa.geburtsdatum = null;
    }

    if (!eingabenMa.telefon) {
        eingabenMa.telefon = null;
    }

    try {

            await mitarbeiter.update({
                anrede: eingabenMa.anrede,
                vorname: eingabenMa.vorname,
                nachname: eingabenMa.nachname,
                email: eingabenMa.email,
                telefon: eingabenMa.telefon,
                geburtsdatum: eingabenMa.geburtsdatum,
                profilbild: eingabenMa.profilbild,
                anzahl: eingabenMa.anzahl,
                honorar: eingabenMa.honorar
            },

                {
                    where: {
                        id: maId
                    }

                });

            await Adresse.update({
                plz: eingabenMa.plz,
                ort: eingabenMa.ort,
                strasse: eingabenMa.strasse,
                land: eingabenMa.land
            }, {
                where: {
                    MitarbeiterId: maId
                }
            });

            req.flash('erfolg', 'Mitarbeiter wurde erfolgreich geändert');
            return res.redirect('/mitarbeiter');

    } catch (err) {
        console.log(err);
        req.flash('error', 'Update konnte nicht durchgeführt werden');
        return res.render('admin-theme/neuer-mitarbeiter', {
            pageTitle: 'Mitarbeiter bearbeiten',
            ma: eingabenMa,
            path: '/neuer-mitarbeiter',
            editing: true
        })
    }
}

exports.postDeleteMitarbeiter = async (req, res, next) => {

    try {
        const ma = await Mitarbeiter.findOne({
            where: {
                id: req.body.maId
            }
        });

        await ma.destroy({
            where: {
                id: req.body.maId
            }
        });

        await Adresse.destroy({
            where: {
                MitarbeiterId: req.body.maId
            }
        });

        req.flash('erfolg', 'Mitarbeiter wurde erfolgreich gelöscht');
        return res.redirect('/mitarbeiter');

    } catch (error) {
        console.log(error);
        req.flash('error', 'Mitarbeiter konnte nicht gelöscht werden');
        return res.redirect('/mitarbeiter');
    }
}