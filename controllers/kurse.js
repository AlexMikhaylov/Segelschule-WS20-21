'use strict';

const Sequelize = require('sequelize');

const PDFDocument = require('pdfkit');

const Kurs = require('../models/Kurs');
const Buchung = require('../models/Buchung');
const Mitarbeiter = require('../models/Mitarbeiter');
const Kunde = require('../models/Kunde');
const Kursplan = require('../models/Kursplan');
const Termin = require('../models/Termin');
const Kursplan_Mitarbeiter = require('../models/Kursplan_Mitarbeiter');

const sequelize = require('../util/database');
const Adresse = require('../models/Adresse');

const Op = Sequelize.Op;

const image_format = ['image/png', 'image/jpg', 'image/jpeg'];

let gefundenerKurs;


exports.getNeuerKurs = (req, res, next) => {
    res.render('admin-theme/neuer-kurs', {
        pageTitle: 'Neuer Kurs',
        path: '/neuer-kurs',
        editing: false
    });
}

exports.getKurse = (req, res, next) => {
    let alleKurse;

    Kurs.findAll()
        .then(kurse => {
            alleKurse = kurse;
            // gefundeneKurse = kurse;
            res.render('admin-theme/kurse-verwalten', {
                kurse: kurse,
                pageTitle: 'Kursverwaltung',
                path: '/kurse-verwalten',
                editing: false
            });
        }).catch(err => {
            console.log(err);
            req.flash('error', 'findAll() Fehler beim Laden der Kursdaten');
            res.redirect('/neuer-kurs');

        });
}

exports.getKursplan = async (req, res, next) => {

    const data = await Kursplan.findAll({
        include: [Kurs, Mitarbeiter, Termin]
    });

    // res.json(data);

    res.render('admin-theme/kursplan', {
        pageTitle: 'Kursplan',
        path: '/kursplan',
        data: data
    })
}

exports.postNeuerTermin = async (req, res, next) => {

    const kursId = req.body.kursId;
    const kurs = await Kurs.findByPk(kursId);
    const mitarbeiter = await Mitarbeiter.findAll();

    const neueEingaben = {
        kursId: kursId,
        kursleiter: req.body.kursleiter,
        tage: req.body.termine,
        startZeiten: req.body.startZeiten,
        bemerkungen: req.body.bemerkungen,
        endZeiten: []
    }

    if(kurs.anzahlKursleiter === 1){
        neueEingaben.kursleiter = [neueEingaben.kursleiter];
    }

    // validate the amount of teachers
    if (neueEingaben.kursleiter.length !== kurs.anzahlKursleiter) {

        req.flash('error', 'Anzahl der ausgewählten Kursleiter entspricht nicht der Kursbeschreibung: ' + kurs.anzahlKursleiter)
        return res.render('admin-theme/neuer-termin2', {
            pageTitle: 'Neuer Termin',
            path: '/neuer-termin',
            editing: false,
            kurs: kurs,
            neueEingaben: neueEingaben,
            mitarbeiter: mitarbeiter
        });
    }

    //validation the date order

    if (kurs.dauerTage > 1) {
        const time = [];

        for (let i = 0; i < neueEingaben.tage.length; ++i) {
            const zeitMls = Date.parse(neueEingaben.tage[i]);
            time.push(zeitMls);

            if ((i >= 1) && (zeitMls < time[i - 1])) {
                req.flash('error', 'Fehler bei der Termineingabe. Bitte überprüfen Sie die Termin-Reihenfolge ' + neueEingaben.tage)
                return res.render('admin-theme/neuer-termin2', {
                    pageTitle: 'Neuer Termin',
                    path: '/neuer-termin',
                    editing: false,
                    kurs: kurs,
                    neueEingaben: neueEingaben,
                    mitarbeiter: mitarbeiter
                });
            }
        }
    }


    //defining the end time
    if (kurs.dauerTage > 1) {

        for (let i = 0; i < neueEingaben.startZeiten.length; i++) {
            const temp = neueEingaben.startZeiten[i].split(':');
            const startStunde = parseInt(temp[0]);
            const endeStunde = startStunde + kurs.dauerStunden;
            const t = endeStunde + ':' + temp[1];

            neueEingaben.endZeiten.push(t);
            console.log(temp, startStunde, endeStunde, t, neueEingaben.endZeiten[i], neueEingaben.startZeiten[i]);
        }

    } else if (kurs.dauerTage === 1) {

        const temp = neueEingaben.startZeiten.split(':');
        const startStunde = parseInt(temp[0]);
        const endeStunde = startStunde + kurs.dauerStunden;
        const t = endeStunde + ':' + temp[1];

        neueEingaben.endZeiten.push(t);
        // neueEingaben.endZeiten.push(t);

        neueEingaben.startZeiten = [neueEingaben.startZeiten];
        neueEingaben.tage = [neueEingaben.tage];
        neueEingaben.bemerkungen = [neueEingaben.bemerkungen];
        console.log(temp, startStunde, endeStunde, t, neueEingaben.endZeiten, neueEingaben.startZeiten);
    }



    console.log(neueEingaben);

    const ueberschneidungen = [];

    let id = 0;
    for (let i = 0; i < neueEingaben.startZeiten.length; i++) {
        const kursplan = await Kursplan.findAll({
            include: [
                {
                    model: Termin,
                    where: {
                        datum: {
                            [Op.or]: neueEingaben.tage
                        },
                        [Op.or]: {
                            beginnUhrzeit: {
                                [Op.between]: [neueEingaben.startZeiten[i], neueEingaben.endZeiten[i]]

                            },
                            endeUhrzeit: {
                                [Op.between]: [neueEingaben.startZeiten[i], neueEingaben.endZeiten[i]]

                            }
                        }



                    }
                },
                {
                    model: Mitarbeiter,
                    where: {
                        id: {
                            [Op.or]: neueEingaben.kursleiter
                        }
                    }
                },
                {
                    model: Kurs
                }
            ]
        });


        if (kursplan.length > 0 && id === 0) {
            id = kursplan[0].id;
            ueberschneidungen.push(kursplan[0]);
        }
    }

    id = 0;
    if (ueberschneidungen.length > 0) {
        const termine = [`Kurs: ${ueberschneidungen[0].Kur.kursName}`];

        for (let termin of ueberschneidungen[0].Termins) {
            termine.push(` Termin: ${termin.datum} von ${termin.beginnUhrzeit} bis ${termin.endeUhrzeit}`);
        }

        for (let kursleiter of ueberschneidungen[0].Mitarbeiters) {
            termine.push(` ${kursleiter.vorname} ${kursleiter.nachname}`)
        }



        // res.json(ueberschneidungen);
        req.flash('error', 'Kursplan kann nicht gespeichert werden. Überschneidung mit dem  ' + termine)
        return res.render('admin-theme/neuer-termin2', {
            pageTitle: 'Neuer Termin',
            path: '/neuer-termin',
            editing: false,
            error: ueberschneidungen[0],
            kurs: kurs,
            neueEingaben: neueEingaben,
            mitarbeiter: mitarbeiter
        });
    } else {
        // res.json('keine Überschnedungen');
        try {

            const kp = await Kursplan.create({
                datumStart: neueEingaben.tage[0],
                datumEnde: neueEingaben.tage[neueEingaben.tage.length - 1],
                eingeschrieben: 0,
                KurId: kursId
            });

            for (let i = 0; i < neueEingaben.tage.length; i++) {

                const tag = neueEingaben.tage[i];
                const start = neueEingaben.startZeiten[i];
                const ende = neueEingaben.endZeiten[i];
                const bemerkung = neueEingaben.bemerkungen[i];

                await Termin.create({
                    datum: tag,
                    beginnUhrzeit: start,
                    endeUhrzeit: ende,
                    bemerkung: bemerkung,
                    KursplanId: kp.id
                });
            }

            for (let i = 0; i < neueEingaben.kursleiter.length; i++) {

                const id = neueEingaben.kursleiter[i];

                await Kursplan_Mitarbeiter.create({
                    MitarbeiterId: id,
                    KursplanId: kp.id
                });
            }

            req.flash('erfolg', 'Kursplan wurde erfolgreich gespeichert');
            return res.redirect('/kursplan');
        } catch (error) {
            console.log(error);
            req.flash('error', 'Fehler bei der Kursplanerstellung')
            return res.render('admin-theme/neuer-termin2', {
                pageTitle: 'Neuer Termin',
                path: '/neuer-termin',
                editing: false,
                error: ueberschneidungen[0],
                kurs: kurs,
                neueEingaben: neueEingaben,
                mitarbeiter: mitarbeiter
            });
        }

    }



}

exports.postAddKurs = (req, res, next) => {

    const kursName = req.body.kursName.trim();
    const anzahlKursleiter = req.body.anzahlKursleiter.trim();
    const dauerStunden = req.body.dauerStunden.trim();
    const dauerTage = req.body.dauerTage.trim();
    const material = req.body.material.trim();
    const maxTeilnehmer = req.body.maxTeilnehmer.trim();
    const preisKurs = req.body.preisKurs.trim();
    const beschreibung = req.body.beschreibung.trim();

    let preisPruefung = req.body.preisPruefung.trim();
    let kursLogo = null;

    if (!preisPruefung) {
        preisPruefung = null;
    }

    if (req.files) {
        const bildData = req.files.kursLogo;


        if (image_format.includes(bildData.mimetype)) {
            bildData.mv('./public/uploads/' + bildData.name);
            kursLogo = '/uploads/' + bildData.name;
        } else {
            req.flash('error', 'Ungültiges Bild-Format. Bitte wählen Sie eine jpg, jpeg oder png Datei');
            return res.redirect('/neuer-kurs');
        }
    }

    //checking if the course exists
    Kurs.findOne({
        where: {
            kursName: {
                [Op.eq]: kursName
            }

        }
    }).then(data => {

        if (data) {
            req.flash('error', 'Der Kurs mit dem Namen ' + kursName + ' existiert bereits');
            res.redirect('/neuer-kurs');
        } else {
            //creating
            Kurs.create({
                kursName: kursName,
                kursLogo: kursLogo,
                beschreibung: beschreibung,
                anzahlKursleiter: anzahlKursleiter,
                dauerStunden: dauerStunden,
                dauerTage: dauerTage,
                material: material,
                maxTeilnehmer: maxTeilnehmer,
                preisKurs: preisKurs,
                preisPruefung: preisPruefung
            })
                .then((kurs) => {

                    req.flash('erfolg', 'Kurs wurde erfolgreich erstellt');
                    return res.redirect('/kurse-verwalten');


                }).catch(err => {
                    // res.redirect('/kurse', {
                    //     pageTitle: 'Kursangebot',
                    //     path: '/kurse',
                    //     kurse: gefundeneKurse,
                    //     error: err[0]
                    console.log(err);
                    req.flash('error', 'create: Fehler bei der Erstellung des Kurses');
                    res.redirect('/neuer-kurs');
                    // })
                });
        }
    })
        .catch(err => {
            console.log(err);
            req.flash('error', 'findOne: Fehler bei der Erstellung des Kurses');
            res.redirect('/neuer-kurs');
        })



}

exports.getEditKurs = (req, res, next) => {

    //checking for the query parameters in the url: if the param "edit" is set to "true"
    const editMode = req.query.edit; //extracting

    if (editMode !== 'true') {
        req.flash('error', 'getEditKurs: Fehler beim Aufruf des Links');
        return res.redirect('/kurse-verwalten');
    }



    const kursId = req.params.kursId;

    Kurs.findByPk(kursId)
        .then(kurs => {
            gefundenerKurs = kurs;
            //if the product with that id hasnt been found


            if (!kurs) {

                req.flash('error', 'findByPk() !kurs Kurs wurde nicht gefunden');
                return res.redirect('/kurse-verwalten');
            }

            return res.render('admin-theme/neuer-kurs', {
                pageTitle: 'Kurs bearbeiten',
                path: '/kurse-verwalten',
                editing: editMode,
                kurs: kurs
            })
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'findByPk() catch err Kurs wurde nicht gefunden');
            return res.redirect('/kurse-verwalten');
        });
}

exports.postEditKurs = async (req, res, next) => {

    const kursId = req.body.kursId;
    gefundenerKurs = await Kurs.findByPk(kursId);

    const eingabenKurs = {
        kursName: req.body.kursName.trim(),
        anzahlKursleiter: req.body.anzahlKursleiter.trim(),
        dauerStunden: req.body.dauerStunden.trim(),
        dauerTage: req.body.dauerTage.trim(),
        material: req.body.material.trim(),
        maxTeilnehmer: req.body.maxTeilnehmer.trim(),
        preisKurs: req.body.preisKurs.trim(),
        preisPruefung: req.body.preisPruefung.trim(),
        kursLogo: gefundenerKurs.kursLogo,
        beschreibung: req.body.beschreibung.trim()
    }


    if (!eingabenKurs.preisPruefung) {
        eingabenKurs.preisPruefung = null;
    }

    if (req.body.deleteBildkurs) {
        eingabenKurs.kursLogo = null;
    }

    if (req.files) {
        const bildData = req.files.kursLogo;


        if (image_format.includes(bildData.mimetype)) {
            bildData.mv('./public/uploads/' + bildData.name);
            eingabenKurs.kursLogo = '/uploads/' + bildData.name;
        } else {
            req.flash('error', 'Ungültiges Bild-Format. Bitte wählen Sie eine jpg, jpeg oder png Datei');
            return res.render('admin-theme/neuer-kurs', {
                pageTitle: 'Kurs bearbeiten',
                kurs: eingabenKurs,
                path: '/neuer-kurs',
                editing: true
            })
        }
    }

    try {


        //checking if the email adresse in another profile exists
        const namencheck = await Kurs.findOne({
            where: {
                [Op.and]: [
                    {
                        id: {
                            [Op.ne]: kursId
                        }
                    },
                    {
                        kursName: {
                            [Op.eq]: eingabenKurs.kursName
                        }
                    }
                ]
            }
        });

        if (namencheck) {
            req.flash('error', 'Kurs mit dem Namen ' + eingabenKurs.kursName + ' existiert bereits');
            return res.render('admin-theme/neuer-kurs', {
                pageTitle: 'Kurs bearbeiten',
                kunde: eingabenKurs,
                path: '/neuer-kurs',
                editing: true
            })
        } else {
            await gefundenerKurs.update({
                kursName: eingabenKurs.kursName,
                kursLogo: eingabenKurs.kursLogo,
                beschreibung: eingabenKurs.beschreibung,
                anzahlKursleiter: eingabenKurs.anzahlKursleiter,
                dauerStunden: eingabenKurs.dauerStunden,
                dauerTage: eingabenKurs.dauerTage,
                material: eingabenKurs.material,
                maxTeilnehmer: eingabenKurs.maxTeilnehmer,
                preisKurs: eingabenKurs.preisKurs,
                preisPruefung: eingabenKurs.preisPruefung
            });

            req.flash('erfolg', 'Kurs wurde erfolgreich geändert');
            return res.redirect('/kurse-verwalten');


        }

    } catch (err) {
        console.log(err);
        req.flash('error', 'Update konnte nicht gemacht werden');
        return res.render('admin-theme/neuer-kurs', {
            pageTitle: 'Kurs bearbeiten',
            kunde: eingabenKurs,
            path: '/neuer-kurs',
            editing: true
        })
    }
}

exports.postDeleteKurs = (req, res, next) => {

    const kursId = req.body.kursId.trim();
    // const prodPrice = req.body.productPrice;

    Kurs.findByPk(kursId)
        .then((kurs) => {
            return kurs.destroy();
        })
        .then(result => {
            req.flash('erfolg', 'Kurs wurde erfolgreich gelöscht');
            return res.redirect('/kurse-verwalten');
        })
        .catch(err => {
            console.log(err)
            req.flash('error', 'Kurs konnte nicht gelöscht werden');
            return res.redirect('/kurse-verwalten');
        });
}


exports.getNeuerTermin = async (req, res, next) => {
    const kursId = req.query.kursId;
    console.log(kursId);

    const kurse = await Kurs.findAll();

    const data = await Kursplan.findAll({
        include: [Kurs, Termin, Mitarbeiter]
    });

    // res.json(data)

    if (!kursId) {
        res.render('admin-theme/neuer-termin', {
            pageTitle: 'Neuer Termin',
            path: '/neuer-termin',
            editing: false,
            kurse: kurse
        })
    } else {

        const kurs = await Kurs.findByPk(kursId);
        const mitarbeiter = await Mitarbeiter.findAll();

        res.render('admin-theme/neuer-termin2', {
            pageTitle: 'Neuer Termin',
            path: '/neuer-termin',
            editing: false,
            error: false,
            kurs: kurs,
            data: data,
            mitarbeiter: mitarbeiter
        })
    }

}

exports.getKursplanBuchen = async (req, res, next) => {
    const kursplanId = req.params.kursplanId;
    const order = req.query.order;



    try {
        const kunden = await Kunde.findAll();
        const kursplan = await Kursplan.findByPk(kursplanId, {
            include: [Kurs, Termin, Mitarbeiter]
        });

        // res.json(kursplan);

        return res.render('admin-theme/neue-buchung', {
            pageTitle: 'Neue Buchung',
            path: '/neue-buchung',
            editing: false,
            kunden: kunden,
            kursplan: kursplan
        });

    } catch (error) {
        console.log(error)
        req.flash('error', 'getKursplanBuchen Fehler');
        return res.redirect('/kursplan');
    }
}

exports.postNeueBuchung = async (req, res, next) => {

    const neueBuchung = {
        kundenId: parseInt(req.body.kundenId),
        kursplanId: parseInt(req.body.kursplanId),
        kursId: parseInt(req.body.kursId),
        kursMax: parseInt(req.body.kursMax),
        kursPreisCheckbox: req.body.kursPreisCheckbox,
        kursPruefungCheckbox: req.body.kursPruefungCheckbox,
        mwst: req.body.mwst,
        summe: 0,
        nurPruefung: 0
    }



    try {
        const kunde = await Kunde.findByPk(neueBuchung.kundenId);


        const kursplan = await Kursplan.findOne({
            where: {
                id: neueBuchung.kursplanId,
                KurId: neueBuchung.kursId
            },
            include: [Kurs, Mitarbeiter, Termin]
        });

        //checking if this customer has ordered the course already
        const schonGebucht = await Buchung.findOne({
            where: {
                KundeId: kunde.id,
                KursplanId: kursplan.id
            }
        });

        if (schonGebucht) {
            req.flash('error', 'Dieser Kunde hat den Kurs \"' + kursplan.Kur.kursName + '\" bereits gebucht');
            return res.redirect('/buchungen#buchung' + schonGebucht.id);
        }


        //checking the order sum
        if (neueBuchung.kursPreisCheckbox && neueBuchung.kursPruefungCheckbox) {

            //Preis und Prüfung
            neueBuchung.summe = (parseFloat(kursplan.Kur.preisKurs) + parseFloat(kursplan.Kur.preisPruefung)) * kunde.anzahl;

        } else if (neueBuchung.kursPreisCheckbox && !neueBuchung.kursPruefungCheckbox) {

            //nur Kurs ohne Prüfung
            neueBuchung.summe += (parseFloat(kursplan.Kur.preisKurs) * kunde.anzahl);

        } else if (!neueBuchung.kursPreisCheckbox && neueBuchung.kursPruefungCheckbox) {

            //Nur Prüfung ohne Teilnehme am Kurs
            neueBuchung.summe += (parseFloat(kursplan.Kur.preisPruefung) * kunde.anzahl);
            neueBuchung.nurPruefung = 1;

            kunde.anzahl = 0;
        } else if (!neueBuchung.kursPreisCheckbox && !neueBuchung.kursPruefungCheckbox) {
            req.flash('error', 'Keine Kosten wurde ausgewählt');
            return res.redirect('/kursplan-buchen/' + neueBuchung.kursplanId + '?order=true');
        }


        //check the booking amount
        let neueTeilnehmerZahl = kunde.anzahl + kursplan.eingeschrieben;

        if (neueTeilnehmerZahl > kursplan.Kur.maxTeilnehmer) {
            req.flash('error', 'Buchung nicht erfolgrech. Anzahl der Kurs-Telnehmer wird überschritten');
            return res.redirect('/kursplan-buchen/' + neueBuchung.kursplanId + '?order=true');
        } else {
            kursplan.eingeschrieben = neueTeilnehmerZahl;
        }

        if (neueBuchung.mwst) {
            neueBuchung.summe += neueBuchung.summe * 0.19;
        }

        neueBuchung.summe = neueBuchung.summe.toFixed(2);

        console.log(neueBuchung);
        await kursplan.update({
            eingeschrieben: kursplan.eingeschrieben
        });

        const gebucht = await Buchung.create({
            summe: neueBuchung.summe,
            nurPruefung: neueBuchung.nurPruefung,
            KundeId: kunde.id,
            KursplanId: kursplan.id,
            status: 'aktiv'
        });

        req.flash('erfolg', 'Buchung war erfolgreich');
        return res.redirect('/buchungen#buchung' + gebucht.id);

    } catch (error) {
        console.log(error);
        req.flash('error', 'postNeueBuchung Fehler');
        return res.redirect('/kursplan-buchen/' + neueBuchung.kursplanId + '?order=true');
    }
}

exports.getBuchungen = async (req, res, next) => {

    try {
        const buchungen = await Buchung.findAll({
            include: [
                {
                    model: Kursplan,
                    include: [Kurs, Termin, Mitarbeiter]
                },
                {
                    model: Kunde
                }
            ]
        });


        // res.json(buchungen);

        res.render('admin-theme/buchungen', {
            pageTitle: 'Buchungen',
            path: '/buchungen',
            buchungen: buchungen,
            editing: false

        });
    } catch (error) {
        console.log(error);
        req.flash('error', 'getBuchungen Fehler beim Laden der Daten');
        return res.redirect('/kursplan');
    }

}

exports.postDeleteBuchung = async (req, res, next) => {
    const buchungId = req.body.buchungId.trim();

    try {
        const buchung = await Buchung.findOne({
            where: {
                id: buchungId
            },
            include: [Kunde, Kursplan]
        });

        // const kursplan = Kursplan.findOne({
        //     where: {
        //         id: buchung.Kursplan.id
        //     }
        // });


        if (!buchung.nurPruefung) {

            let teilnehmerNeu = buchung.Kursplan.eingeschrieben -= buchung.Kunde.anzahl;

            if (teilnehmerNeu < 0) {
                teilnehmerNeu = 0;
            }

            await buchung.Kursplan.update({
                eingeschrieben: teilnehmerNeu
            });
        }

        if (req.body.destroy === 'destroy') {

            await buchung.destroy();

            req.flash('erfolg', 'Buchung wurde entgültig gelöscht');
            return res.redirect('/buchungen');

        } else {
            await buchung.update({
                status: 'storniert'
            });
            req.flash('erfolg', 'Buchung wurde erfolgreich storniert');
            return res.redirect('/buchungen');
        }




    }
    catch (err) {
        console.log(err)
        req.flash('error', 'Buchung konnte nicht gelöscht werden');
        return res.redirect('/buchungen');
    }
}

exports.getEditBuchung = async (req, res, next) => {
    const editMode = req.query.edit; //extracting
    const buchungId = req.params.buchungId;

    try {

        if (editMode !== 'true') {
            req.flash('error', 'getEditBuchung: Fehler beim Aufruf des Links');
            return res.redirect('/buchungen');
        }

        const buchung = await Buchung.findOne({
            where: {
                id: buchungId
            },
            include: [
                {
                    model: Kursplan,
                    include: [Kurs, Termin, Mitarbeiter]
                },
                {
                    model: Kunde
                }
            ]
        });

        const kursplan = buchung.Kursplan;


        if (!buchung) {

            req.flash('error', 'Buchung.findOne Buchung wurde nicht gefunden');
            return res.redirect('/buchungen');
        }

        return res.render('admin-theme/neue-buchung', {
            pageTitle: 'Kurs bearbeiten',
            path: '/buchungen',
            editing: editMode,
            buchung: buchung,
            kursplan: kursplan
        })
    }
    catch (err) {
        console.log(err);
        req.flash('error', 'Buchung wurde nicht gefunden');
        return res.redirect('/buchungen');
    }
}

exports.postEditBuchung = async (req, res, next) => {

    const updatedBuchung = {
        buchungId: parseInt(req.body.buchungId),
        kundenId: parseInt(req.body.kundenIdEdit),
        kursplanId: parseInt(req.body.kursplanId),
        kursId: parseInt(req.body.kursId),
        kursMax: parseInt(req.body.kursMax),
        kursPreisCheckbox: req.body.kursPreisCheckbox,
        kursPruefungCheckbox: req.body.kursPruefungCheckbox,
        mwst: req.body.mwst,
        summe: 0,
        nurPruefung: false
    }

    try {

        const buchung = await Buchung.findOne({
            where: {
                id: updatedBuchung.buchungId,
                KursplanId: updatedBuchung.kursplanId,
                KundeId: updatedBuchung.kundenId

            },
            include: [
                {
                    model: Kursplan,
                    include: [Kurs, Termin, Mitarbeiter]
                },
                {
                    model: Kunde
                }
            ]
        });

        const kunde = buchung.Kunde;

        const kursplan = buchung.Kursplan;

        //checking if this customer has ordered the course already
        const schonGebucht = await Buchung.findOne({
            where: {
                id: {
                    [Op.ne]: buchung.id
                },
                KundeId: kunde.id,
                KursplanId: kursplan.id
            }
        });

        if (schonGebucht) {
            req.flash('error', 'Dieser Kunde hat den Kurs \"' + kursplan.Kur.kursName + '\" bereits gebucht');
            return res.redirect('/buchungen#buchung' + schonGebucht.id);
        }


        //checking the order sum
        if (updatedBuchung.kursPreisCheckbox && updatedBuchung.kursPruefungCheckbox) {

            //Preis und Prüfung
            updatedBuchung.summe = (parseFloat(kursplan.Kur.preisKurs) + parseFloat(kursplan.Kur.preisPruefung)) * kunde.anzahl;

        } else if (updatedBuchung.kursPreisCheckbox && !updatedBuchung.kursPruefungCheckbox) {

            //nur Kurs ohne Prüfung
            updatedBuchung.summe += (parseFloat(kursplan.Kur.preisKurs) * kunde.anzahl);

        } else if (!updatedBuchung.kursPreisCheckbox && updatedBuchung.kursPruefungCheckbox) {

            //Nur Prüfung ohne Teilnehme am Kurs
            updatedBuchung.summe += (parseFloat(kursplan.Kur.preisPruefung) * kunde.anzahl);
            updatedBuchung.nurPruefung = true;


        } else if (!neueBuchung.kursPreisCheckbox && !neueBuchung.kursPruefungCheckbox) {
            req.flash('error', 'Keine Kosten wurde ausgewählt');
            return res.redirect('/buchung-bearbeiten/' + updatedBuchung.buchungId + '?edit=true');
        }



        if (!updatedBuchung.kursPreisCheckbox && !buchung.nurPruefung) {
            kursplan.eingeschrieben -= kunde.anzahl;
        }

        if ((buchung.nurPruefung && updatedBuchung.kursPreisCheckbox) || (buchung.status === 'storniert')) {
            kursplan.eingeschrieben += kunde.anzahl;
        }

        if (updatedBuchung.mwst) {
            updatedBuchung.summe += updatedBuchung.summe * 0.19;
        }

        updatedBuchung.summe = updatedBuchung.summe.toFixed(2);

        await kursplan.update({
            eingeschrieben: kursplan.eingeschrieben
        });

        const b = await buchung.update({
            summe: updatedBuchung.summe,
            nurPruefung: updatedBuchung.nurPruefung,
            status: 'aktiv'
        });

        req.flash('erfolg', 'Buchung war erfolgreich');
        return res.redirect('/buchungen#buchung' + buchung.id);

    } catch (error) {
        console.log(error);
        req.flash('error', 'postEditBuchung Fehler');
        return res.redirect('/buchung-bearbeiten/' + updatedBuchung.buchungId + '?edit=true');
    }
}

exports.postDeleteKursplan = async (req, res, next) => {
    const kursplanId = req.body.kursplanId;

    try {
        const kursplan = await Kursplan.findByPk(kursplanId);
        await kursplan.destroy();

        req.flash('erfolg', 'Kursplan wurde erfolgreich gelöscht');
        return res.redirect('/kursplan');

    } catch (error) {
        console.log(error)
        req.flash('error', 'Kursplan konnte nicht gelöscht werden');
        return res.redirect('/kursplan');
    }
}

exports.getEditKursplan = async (req, res, next) => {
    const kursplanId = req.params.kursplanId;
    const editMode = req.query.edit;


    try {

        if (editMode !== 'true') {
            req.flash('error', 'getEditKursplan: Fehler beim Aufruf des Links');
            return res.redirect('/kursplan');
        }

        const mitarbeiter = await Mitarbeiter.findAll();

        const kursplan = await Kursplan.findOne({
            where: {
                id: kursplanId
            },
            include: [
                {
                    model: Kurs
                },
                {
                    model: Termin
                }
            ]
        });

        const kurs = kursplan.Kur;


        if (!kursplan || !kurs || !mitarbeiter) {

            req.flash('error', 'Fehler beim Abruf der Daten');
            return res.redirect('/kursplan');
        }

        return res.render('admin-theme/neuer-termin2', {
            pageTitle: 'Kursplan bearbeiten',
            path: '/buchungen',
            editing: editMode,
            mitarbeiter: mitarbeiter,
            kursplan: kursplan,
            kurs: kurs
        })
    }
    catch (err) {
        console.log(err);
        req.flash('error', 'Kursplan konnte nicht geladen werden');
        return res.redirect('/kursplan');
    }
}

exports.postEditKursplan = async (req, res, next) => {

    const kursplanId = req.body.kursplanId;

    const kursplan = await Kursplan.findOne({
        where: {
            id: kursplanId
        },
        include: [
            {
                model: Kurs
            },
            {
                model: Termin
            }
        ]
    });

    const kursId = req.body.kursId;
    const kurs = await Kurs.findByPk(kursId);
    const mitarbeiter = await Mitarbeiter.findAll();

    const neueEingaben = {
        kursId: kursId,
        kursplanId: kursplanId,
        kursleiter: req.body.kursleiter,
        tage: req.body.termine,
        startZeiten: req.body.startZeiten,
        bemerkungen: req.body.bemerkungen,
        endZeiten: []
    }

    if(kurs.anzahlKursleiter === 1){
        neueEingaben.kursleiter = [neueEingaben.kursleiter];
    }
    
    // validate the amount of teachers
    if (neueEingaben.kursleiter.length !== kurs.anzahlKursleiter) {

        req.flash('error', 'Anzahl der ausgewählten Kursleiter entspricht nicht der Kursbeschreibung: ' + kurs.anzahlKursleiter)
        return res.render('admin-theme/neuer-termin2', {
            pageTitle: 'Neuer Termin',
            path: '/neuer-termin',
            editing: true,
            kurs: kurs,
            kursplan: kursplan,
            mitarbeiter: mitarbeiter
        });
    }

    //validation the date order

    if (kurs.dauerTage > 1) {
        const time = [];

        for (let i = 0; i < neueEingaben.tage.length; ++i) {
            const zeitMls = Date.parse(neueEingaben.tage[i]);
            time.push(zeitMls);

            if ((i >= 1) && (zeitMls < time[i - 1])) {
                req.flash('error', 'Fehler bei der Termineingabe. Bitte überprüfen Sie die Termin-Reihenfolge ' + neueEingaben.tage)
                return res.render('admin-theme/neuer-termin2', {
                    pageTitle: 'Neuer Termin',
                    path: '/neuer-termin',
                    editing: true,
                    kurs: kurs,
                    kursplan: kursplan,
                    neueEingaben: neueEingaben,
                    mitarbeiter: mitarbeiter
                });
            }
        }
    }


    //defining the end time
    if (kurs.dauerTage > 1) {

        for (let i = 0; i < neueEingaben.startZeiten.length; i++) {
            const temp = neueEingaben.startZeiten[i].split(':');
            const startStunde = parseInt(temp[0]);
            const endeStunde = startStunde + kurs.dauerStunden;
            const t = endeStunde + ':' + temp[1];

            neueEingaben.endZeiten.push(t);
            console.log(temp, startStunde, endeStunde, t, neueEingaben.endZeiten[i], neueEingaben.startZeiten[i]);
        }

    } else if (kurs.dauerTage === 1) {

        const temp = neueEingaben.startZeiten.split(':');
        const startStunde = parseInt(temp[0]);
        const endeStunde = startStunde + kurs.dauerStunden;
        const t = endeStunde + ':' + temp[1];

        neueEingaben.endZeiten.push(t);
        // neueEingaben.endZeiten.push(t);

        neueEingaben.startZeiten = [neueEingaben.startZeiten];
        neueEingaben.tage = [neueEingaben.tage];
        neueEingaben.bemerkungen = [neueEingaben.bemerkungen];
        console.log(temp, startStunde, endeStunde, t, neueEingaben.endZeiten, neueEingaben.startZeiten);
    }



    console.log(neueEingaben);

    const ueberschneidungen = [];

    let id = 0;
    for (let i = 0; i < neueEingaben.startZeiten.length; i++) {
        const kursplan = await Kursplan.findAll({
            where: {
                id: {
                    [Op.ne]: kursplanId
                }
            },

            include: [
                {
                    model: Termin,
                    where: {
                        datum: {
                            [Op.or]: neueEingaben.tage
                        },


                        [Op.or]: {
                            beginnUhrzeit: {
                                [Op.between]: [neueEingaben.startZeiten[i], neueEingaben.endZeiten[i]]

                            },
                            endeUhrzeit: {
                                [Op.between]: [neueEingaben.startZeiten[i], neueEingaben.endZeiten[i]]

                            }
                        }



                    }
                },
                {
                    model: Mitarbeiter,
                    where: {
                        id: {
                            [Op.or]: neueEingaben.kursleiter
                        }
                    }
                },
                {
                    model: Kurs
                }
            ]
        });


        if (kursplan.length > 0 && id === 0) {
            id = kursplan[0].id;
            ueberschneidungen.push(kursplan[0]);
        }
    }

    id = 0;
    if (ueberschneidungen.length > 0) {
        const termine = [`Kurs: ${ueberschneidungen[0].Kur.kursName}`];

        for (let termin of ueberschneidungen[0].Termins) {
            termine.push(` Termin: ${termin.datum} von ${termin.beginnUhrzeit} bis ${termin.endeUhrzeit}`);
        }

        for (let kursleiter of ueberschneidungen[0].Mitarbeiters) {
            termine.push(` ${kursleiter.vorname} ${kursleiter.nachname}`)
        }



        // res.json(ueberschneidungen);
        req.flash('error', 'Kursplan kann nicht gespeichert werden. Überschneidung mit dem  ' + termine)
        return res.render('admin-theme/neuer-termin2', {
            pageTitle: 'Neuer Termin',
            path: '/neuer-termin',
            editing: true,
            error: ueberschneidungen[0],
            kurs: kurs,
            neueEingaben: neueEingaben,
            kursplan: kursplan,
            mitarbeiter: mitarbeiter
        });
    } else {
        // res.json('keine Überschnedungen');
        try {

            const kp = await kursplan.update({
                datumStart: neueEingaben.tage[0],
                datumEnde: neueEingaben.tage[neueEingaben.tage.length - 1],
                eingeschrieben: kursplan.eingeschrieben,
                KurId: kursId
            });

            for (let i = 0; i < neueEingaben.tage.length; i++) {

                const tag = neueEingaben.tage[i];
                const start = neueEingaben.startZeiten[i];
                const ende = neueEingaben.endZeiten[i];
                const bemerkung = neueEingaben.bemerkungen[i];

                await kursplan.Termins[i].update({

                    datum: tag,
                    beginnUhrzeit: start,
                    endeUhrzeit: ende,
                    bemerkung: bemerkung,



                });
            }

            const km = await Kursplan_Mitarbeiter.destroy({
                where: {
                    KursplanId: kursplan.id
                }
            });

            // await km.destroy();

            for (let i = 0; i < neueEingaben.kursleiter.length; i++) {

                const id = neueEingaben.kursleiter[i];


                await Kursplan_Mitarbeiter.create({
                    MitarbeiterId: id,
                    KursplanId: kp.id
                });
            }

            req.flash('erfolg', 'Kursplan wurde erfolgreich gespeichert');
            return res.redirect('/kursplan');
        } catch (error) {
            console.log(error);
            req.flash('error', 'Fehler bei der Kursplanerstellung')
            return res.render('admin-theme/neuer-termin2', {
                pageTitle: 'Kursplan ändern',
                path: '/neuer-termin',
                editing: true,
                error: ueberschneidungen[0],
                kurs: kurs,
                kursplan: kursplan,
                neueEingaben: neueEingaben,
                mitarbeiter: mitarbeiter
            });
        }

    }

}

exports.getPrintPdf = async (req, res, next) => {
    const buchungId = req.params.buchungId;

    const buchung = await Buchung.findOne({
        where: {
            id: buchungId
        },
        include: [
            {
                model: Kursplan,
                include: [Kurs, Termin, Mitarbeiter]
            },
            {
                model: Kunde,
                include: [Adresse]
            }
        ]
    });


    // Create a document
    let doc = new PDFDocument({ size: "A4", margin: 50 });


    // Finalize PDF file
    generateHeader(doc);
    generateCustomerInformation(doc, buchung);
    generateInvoiceTable(doc, buchung);
    generateFooter(doc);

    doc.end();
    res.contentType('application/pdf');
    doc.pipe(res);
}


//creating static parts
function generateHeader(doc) {
    doc
        .image("./public/assets/images/big/kurslogo.jpg", 50, 45, { width: 50 })
        .fillColor("#444444")
        .fontSize(20)
        .text("Surf and Sailing School", 110, 57)
        .fontSize(10)
        .text("Musterstraße 123", 200, 65, { align: "right" })
        .text("12345 Musterstadt", 200, 80, { align: "right" })
        .moveDown();
}

function generateCustomerInformation(doc, buchung) {
    const adresse = buchung.Kunde.Adresses[0];
    const kurs = buchung.Kursplan.Kur;

    doc
        .fillColor("#444444")
        .fontSize(20)
        .text("Buchungsbestätigung", 50, 160);

    generateHr(doc, 185);

    const customerInformationTop = 200;

    const kursleiter = [];

    for(let i = 0; i < buchung.Kursplan.Mitarbeiters.length; i++){
        if(i === 0){
            kursleiter.push(buchung.Kursplan.Mitarbeiters[i].vorname + ' ' + buchung.Kursplan.Mitarbeiters[i].nachname);
        }else{
            kursleiter.push(' ' + buchung.Kursplan.Mitarbeiters[i].vorname + ' ' + buchung.Kursplan.Mitarbeiters[i].nachname);
        }
        
    }

    doc
        .fontSize(10)
        .text(`Buchungsnummer:`, 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(buchung.id, 150, customerInformationTop)
        .font("Helvetica")
        .text("Buchungsdatum:", 50, customerInformationTop + 15)
        .text(formatDate(buchung.createdAt), 150, customerInformationTop + 15)
        .text("Betrag:", 50, customerInformationTop + 30)
        .text(buchung.summe + ' €',
            150,
            customerInformationTop + 30
        )
        .text("Kurs:", 50, customerInformationTop + 45)
        .text(kurs.kursName,
            150,
            customerInformationTop + 45
        )
        .text("Kursleiter:", 50, customerInformationTop + 60)
        .text(kursleiter,
            150,
            customerInformationTop + 60
        )
        .text("Buchungsstatus:", 50, customerInformationTop + 75)
        .text(buchung.status,
            150,
            customerInformationTop + 75
        )

        .font("Helvetica-Bold")
        .text(`${buchung.Kunde.name1} ${buchung.Kunde.name2}`, 300, customerInformationTop)
        .font("Helvetica")
        .text(adresse.strasse, 300, customerInformationTop + 15)
        .text(
            adresse.plz +
            " " +
            adresse.ort,
            300,
            customerInformationTop + 30
        )
        .text(
            adresse.land,
            300,
            customerInformationTop + 45
        )
        .moveDown();

    generateHr(doc, 297);
}


function generateFooter(doc) {
    doc
        .fontSize(10)
        .text(
            "Bitte überweisen Sie den Betrag innerhalb der nächsten 14 Tage",
            50,
            780,
            { align: "center", width: 500 }
        );
}

function generateTableRow(doc, y, c1, c2, c3, c4, c5) {
    doc
        .fontSize(10)
        .text(c1, 50, y)
        .text(c2, 150, y)
        .text(c3, 280, y, { width: 90, align: "right" })
        .text(c4, 370, y, { width: 90, align: "right" })
        .text(c5, 0, y, { align: "right" });
}


function generateInvoiceTable(doc, buchung) {
    let i;
    const invoiceTableTop = 330;

    doc.font("Helvetica-Bold");
    generateTableRow(
        doc,
        invoiceTableTop,
        "Kurstermin",
        "Bemerkungen",
        "Beginn Uhrzeit",
        "Ende Uhrzeit"
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    for (i = 0; i < buchung.Kursplan.Termins.length; i++) {
        const item = buchung.Kursplan.Termins[i];
        const position = invoiceTableTop + (i + 1) * 30;
        generateTableRow(
            doc,
            position,
            item.datum,
            item.bemerkung,
            item.beginnUhrzeit,
            item.endeUhrzeit
        );
        generateHr(doc, position + 20);
    }
}


function generateHr(doc, y) {
    doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}


function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return day + "/" + month + "/" + year;
}