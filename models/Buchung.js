/**
 * 
 */

'use strict';

const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Buchung = sequelize.define('Buchung', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },

    bewertung: {
        type: Sequelize.SMALLINT,
        validate: {
            min: 1,
            max: 6
        }
    },

    //Kurspreis + eventuell Prüfung + 19% MwSt
    summe:{
        type: Sequelize.DOUBLE,
        allowNull: false
    },

    //ob nur Prüfung gebucht wurde - 0 - Kurs, 1 - nur Prüfung
    nurPruefung: {
        type: Sequelize.BOOLEAN
    },

    // true - aktiv
    status: {
        type: Sequelize.ENUM('aktiv', 'storniert'),
        allowNull: false
    }

    //FK kundenId (1 Kunde - n Buchungen), kursplanId (1 Buchung hat 1 KursplanId )

}, {
    tableName: 'buchungen'
});


module.exports = Buchung;