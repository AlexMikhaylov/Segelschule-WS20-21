/**
 * A course entity
 */

'use strict';

const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Mitarbeiter = sequelize.define('Mitarbeiter', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },

    anrede: {
        type: Sequelize.ENUM('keine', 'Herr', 'Frau', 'andere'),
        defaultValue: 'keine'
    },

    vorname: {
        type: Sequelize.STRING,
        allowNull: false
    },

    nachname: {
        type: Sequelize.STRING,
        allowNull: false
    },

    email: {
        type: Sequelize.STRING,
        allowNull: true
    },

    telefon: {
        type: Sequelize.STRING,
        allowNull: true
    },
    
    profilbild: {
        type: Sequelize.STRING,
        allowNull: true
    },

    bewertung: {
        type: Sequelize.DOUBLE,
        allowNull: true
    },

    honorar: {
        type: Sequelize.DOUBLE,
        allowNull: false
    },

    geburtsdatum: {
        type: Sequelize.DATEONLY,
        allowNull: true
    },
    
    qualifikationen: {
        type: Sequelize.TEXT
    }

}, {
    tableName: 'mitarbeiter'
});


module.exports = Mitarbeiter;