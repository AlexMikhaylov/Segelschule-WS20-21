/**
 * 
 */

'use strict';

const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Kunde = sequelize.define('Kunde', {

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

    name1: {
        type: Sequelize.STRING,
        allowNull: false
    },

    name2: {
        type: Sequelize.STRING,
        allowNull: false
    },

    email: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },

    telefon: {
        type: Sequelize.STRING,
        allowNull: true
    },

    geburtsdatum: {
        type: Sequelize.DATEONLY,
        allowNull: true
    },

    profilbild: {
        type: Sequelize.STRING,
        allowNull: true
    },

    //bei 1 - Einzelkunde, bei > 1 Gruppe
    anzahl: {
        type: Sequelize.INTEGER,
        validate: {
            min: 1
        }
    }

}, {
    tableName: 'kunden'
});


module.exports = Kunde;