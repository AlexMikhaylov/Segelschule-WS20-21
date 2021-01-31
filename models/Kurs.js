/**
 * A course entity
 */

'use strict';

const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Kurs = sequelize.define('Kurs', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },

    kursName: {
        type: Sequelize.STRING,
        allowNull: false
    },

    anzahlKursleiter: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
            min: 0
        }
    },

    maxTeilnehmer: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
            min: 0
        }
    },

    preisKurs: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        validate: {
            min: 0
        }
    },

    preisPruefung: {
        type: Sequelize.DOUBLE,
        validate: {
            min: 0
        }
    },

    kursLogo: {
        type: Sequelize.STRING,
        allowNull: true
    },

    beschreibung: {
        type: Sequelize.TEXT,
        allowNull: true
    },

    dauerStunden: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
            min: 0
        }
    },

    dauerTage: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
            min: 0
        }
    },

    material: {
        type: Sequelize.STRING,
        allowNull: false
    }

}, {
    tableName: 'kurse'
});


module.exports = Kurs;