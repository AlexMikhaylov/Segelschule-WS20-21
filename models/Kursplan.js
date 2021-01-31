/**
 * A course schedule entity
 * has one course pro periode
 */

'use strict';

const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Kursplan = sequelize.define('Kursplan', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },

    // TT.MM.YYYY
    datumStart: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },

    // TT.MM.YYYY
    datumEnde: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },

    // <= Kurs.maxTeilnehmer
    eingeschrieben: {
        type: Sequelize.INTEGER
    }

    //FK kurs_id

}, {
    tableName: 'kursplan'
});


module.exports = Kursplan;