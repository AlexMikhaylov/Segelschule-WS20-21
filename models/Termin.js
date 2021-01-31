/**
 * A course schedule entity
 * with dates and hours
 */

'use strict';

const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Termin = sequelize.define('Termin', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },

    // TT.MM.YYYY
    datum: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },

    // 
    beginnUhrzeit: {
        type: Sequelize.TIME,
        allowNull: false
    },

    //automatisch ausfüllen beginnUhrzeit + Kurs.anzahlStunden
    endeUhrzeit: {
        type: Sequelize.TIME,
        allowNull: false
    },

    bemerkung: {
        type: Sequelize.TEXT
    }

    //FK: kursplanId

}, {
    tableName: 'termine'
});


module.exports = Termin;