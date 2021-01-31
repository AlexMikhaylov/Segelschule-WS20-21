'use strict';


const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Op = Sequelize.Op;

const Kunde = require('../models/Kunde');
const Adresse = require('../models/Adresse');
const Kurs = require('../models/Kurs');

const image_format = ['image/png', 'image/jpg', 'image/jpeg'];

let fetchedKunden;
let fetchedKunde;
let fetchedKurse;
let fetchedKurs;
let fetchedAdresse;

exports.getKundenAnlegen = (req, res, next) => {

    res.render('admin-theme/neuer-kunde', {
        pageTitle: 'Neuer Kunde',
        path: '/neuer-kunde',
        editing: false
    });
}

exports.postKundenAnlegen = (req, res, next) => {

    const eingabenKunde = {
        anrede: req.body.anrede.trim(),
        name1: req.body.name1.trim(),
        name2: req.body.name2.trim(),
        email: req.body.email.trim(),
        anzahl: req.body.anzahl.trim(),
        telefon: req.body.telefon.trim(),
        profilbild: null,
        geburtsdatum: req.body.geburtsdatum.trim(),
        plz: req.body.plz.trim(),
        ort: req.body.ort.trim(),
        strasse: req.body.strasse.trim(),
        land: req.body.land.trim()
    }

    if(req.body.profilbild){
        eingabenKunde.profilbild = req.body.profilbild;
    }

    if (req.files) {
        const bildData = req.files.profilbild;


        if (image_format.includes(bildData.mimetype)) {
            bildData.mv('./public/uploads/' + bildData.name);
            eingabenKunde.profilbild = '/uploads/' + bildData.name;
        } else {
            req.flash('error', 'Ungültiges Bild-Format. Bitte wählen Sie eine jpg, jpeg oder png Datei');
            return res.redirect('/neuer-kunde');
            
        }
    }


    if (!eingabenKunde.geburtsdatum) {
        eingabenKunde.geburtsdatum = null;
    }

    if (!eingabenKunde.telefon) {
        eingabenKunde.telefon = null;
    }

    if (!eingabenKunde.name1) {
        eingabenKunde.name1 = null;
    }

    //checking if the email adresse exists
    Kunde.findOne({
        where: {
            email: {
                [Op.eq]: eingabenKunde.email
            }

        }
    })
        .then(data => {
            if (data) {
                console.log('email exists: ' + data);
                req.flash('error', 'Kunde mit der E-Mail-Adresse ' + eingabenKunde.email + ' existiert bereits');
                return res.render('admin-theme/neuer-kunde', {
                    pageTitle: 'Neuer Kunde',
                    kunde: eingabenKunde,
                    path: '/neuer-kunde',
                    editing: true
                })
            } else {
                Kunde.create({
                    anrede: eingabenKunde.anrede,
                    name1: eingabenKunde.name1,
                    name2: eingabenKunde.name2,
                    email: eingabenKunde.email,
                    telefon: eingabenKunde.telefon,
                    geburtsdatum: eingabenKunde.geburtsdatum,
                    profilbild: eingabenKunde.profilbild,
                    anzahl: eingabenKunde.anzahl

                })
                    .then((kunde) => {
                        // console.log('Created Product')
                        return kunde.createAdresse(
                            {
                                plz: eingabenKunde.plz,
                                ort: eingabenKunde.ort,
                                strasse: eingabenKunde.strasse,
                                land: eingabenKunde.land
                            })
                            .then((adresse) => {
                                req.flash('erfolg', 'Kunde wurde erfolgreich angelegt');
                                return res.redirect('/kunden-verwalten');
                            })
                            .catch(err => {
                                console.log(err);
                                req.flash('error', 'kunde.createAdresse() Fehler bei der Erstellung des Kunden');
                                return res.render('admin-theme/neuer-kunde', {
                                    pageTitle: 'Neuer Kunde',
                                    kunde: eingabenKunde,
                                    path: '/neuer-kunde',
                                    editing: true
                                });
                            })

                    })
                    .catch(err => {
                        console.log(err);
                        req.flash('error', 'Kunde.create() Fehler bei der Erstellung des Kunden');
                        return res.render('admin-theme/neuer-kunde', {
                            pageTitle: 'Neuer Kunde',
                            kunde: eingabenKunde,
                            path: '/neuer-kunde',
                            editing: true
                        });
                    });
            }

        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Kunde.findOne() Fehler bei der Erstellung des Kunden');
            return res.render('admin-theme/neuer-kunde', {
                pageTitle: 'Neuer Kunde',
                kunde: eingabenKunde,
                path: '/neuer-kunde',
                editing: true
            });
        })



}

exports.getKunden = async (req, res, next) => {

    try {
        fetchedKunden = await Kunde.findAll({
            include: Adresse
        });

        return res.render('admin-theme/kunden-verwalten', {
            pageTitle: 'Kundenverwaltung',
            path: '/kunden-verwalten',
            kunden: fetchedKunden,
            editing: false
        });

    } catch (error) {
        console.log(error);
        req.flash('error', 'Kunde.findAll() Daten konnten nicht geladen werden');
        return res.redirect('/404');
    }
}

exports.getEditKunde = async (req, res, next) => {


    //checking for the query parameters in the url: if the param "edit" is set to "true"
    const editMode = req.query.edit; //extracting

    if (editMode !== 'true') {
        req.flash('error', 'getEditKunde: Fehler beim Aufruf des Links');
        return res.redirect('/kunden-verwalten');
    }

    const kundenId = req.params.kundenId;

    try {
        fetchedKunde = await
            Kunde.findOne({
                where: {
                    id: {
                        [Op.eq]: kundenId
                    }
                }
            });

        if (!fetchedKunde) {

            req.flash('error', 'findOne() by Id Kunde wurde nicht gefunden');
            return res.redirect('/kunden-verwalten');
        }

        let fetchedAdresse = await fetchedKunde.getAdresses();

        let updatedKunde = Object.assign(fetchedKunde, {
            plz: fetchedAdresse[0].plz,
            ort: fetchedAdresse[0].ort,
            strasse: fetchedAdresse[0].strasse,
            land: fetchedAdresse[0].land
        });
        // console.log(updatedKunde);

        return res.render('admin-theme/neuer-kunde', {
            pageTitle: 'Kunden bearbeiten',
            path: '/kunden-verwalten',
            editing: editMode,
            kunde: updatedKunde
        });

    } catch (error) {
        console.log(error);
        req.flash('error', 'findOne() Kunde wurde nicht gefunden');
        return res.redirect('/kunden-verwalten');
    }
}

exports.postKundenBearbeiten = async (req, res, next) => {
    const kundenId = req.body.kundenId;
    const kunde = await Kunde.findByPk(kundenId);

    const eingabenKunde = {
        id: kundenId,
        anrede: req.body.anrede.trim(),
        name1: req.body.name1.trim(),
        name2: req.body.name2.trim(),
        email: req.body.email.trim(),
        anzahl: req.body.anzahl.trim(),
        telefon: req.body.telefon.trim(),
        geburtsdatum: req.body.geburtsdatum.trim(),
        profilbild: kunde.profilbild,
        plz: req.body.plz.trim(),
        ort: req.body.ort.trim(),
        strasse: req.body.strasse.trim(),
        land: req.body.land.trim()
    }

    if (req.body.deleteBild) {
        eingabenKunde.profilbild = null;
    }


    if (req.files) {
        const bildData = req.files.profilbild;


        if (image_format.includes(bildData.mimetype)) {
            bildData.mv('./public/uploads/' + bildData.name);
            eingabenKunde.profilbild = '/uploads/' + bildData.name;
        } else {
            req.flash('error', 'Ungültiges Bild-Format. Bitte wählen Sie eine jpg, jpeg oder png Datei');
            return res.render('admin-theme/neuer-kunde', {
                pageTitle: 'Kunden bearbeiten',
                kunde: eingabenKunde,
                path: '/neuer-kunde',
                editing: true
            })
        }
    }



    if (!eingabenKunde.geburtsdatum) {
        eingabenKunde.geburtsdatum = null;
    }

    if (!eingabenKunde.telefon) {
        eingabenKunde.telefon = null;
    }

    if (!eingabenKunde.name1) {
        eingabenKunde.name1 = null;
    }

    try {


        //checking if the email adresse in another profile exists
        const emailCheck = await Kunde.findOne({
            where: {
                [Op.and]: [
                    {
                        id: {
                            [Op.ne]: kundenId
                        }
                    },
                    {
                        email: {
                            [Op.eq]: eingabenKunde.email
                        }
                    }
                ]
            }
        });

        // .then(kunde => {
        if (emailCheck) {
            console.log(emailCheck);

            //anderer kunde mit derselben e-mail-adresse wurde gefunden
            req.flash('error', 'Kunde mit der E-Mail-Adresse ' + eingabenKunde.email + ' existiert bereits');
            return res.render('admin-theme/neuer-kunde', {
                pageTitle: 'Kunden bearbeiten',
                kunde: eingabenKunde,
                path: '/neuer-kunde',
                editing: true
            })
        } else {
            //anderer kunde mit derselben e-mail-adresse wurde nicht gefunden, Änderungen speichern
            await Kunde.update({
                anrede: eingabenKunde.anrede,
                name1: eingabenKunde.name1,
                name2: eingabenKunde.name2,
                email: eingabenKunde.email,
                telefon: eingabenKunde.telefon,
                geburtsdatum: eingabenKunde.geburtsdatum,
                profilbild: eingabenKunde.profilbild,
                anzahl: eingabenKunde.anzahl
            },

                {
                    where: {
                        id: kundenId
                    }

                });

            await Adresse.update({
                plz: eingabenKunde.plz,
                ort: eingabenKunde.ort,
                strasse: eingabenKunde.strasse,
                land: eingabenKunde.land
            }, {
                where: {
                    KundeId: kundenId
                }
            });

            req.flash('erfolg', 'Kunde wurde erfolgreich geändert');
            return res.redirect('/kunden-verwalten');

        }
    }
    catch (err) {
        console.log(err);
        req.flash('error', 'Update konnte nicht gemacht werden');
        return res.render('admin-theme/neuer-kunde', {
            pageTitle: 'Kunden bearbeiten',
            kunde: eingabenKunde,
            path: '/neuer-kunde',
            editing: true
        })
    }
}

exports.postDeleteKunden = async (req, res, next) => {

    try {
        const kunde = await Kunde.findOne({
            where: {
                id: req.body.kundenId
            }
        });

        await kunde.destroy({
            where: {
                id: req.body.kundenId
            }
        });

        await Adresse.destroy({
            where: {
                KundeId: req.body.kundenId
            }
        });

        req.flash('erfolg', 'Kunde wurde erfolgreich gelöscht');
        return res.redirect('/kunden-verwalten');

    } catch (error) {
        console.log(error);
        req.flash('error', 'Kunde konnte nicht gelöscht werden');
        return res.redirect('/kunden-verwalten');
    }
}

