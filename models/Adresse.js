/**
 * A course entity
 */

'use strict';

const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Adresse = sequelize.define('Adresse', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },

    plz: {
        type: Sequelize.STRING,
        allowNull: false
    },

    ort: {
        type: Sequelize.STRING,
        allowNull: false
    },

    strasse: {
        type: Sequelize.STRING,
        allowNull: false
    },

    land: {
        type: Sequelize.STRING,
        allowNull: false
    }

    //FK: kundenId und mitarbeiterId

}, {
    tableName: 'adressen'
});


module.exports = Adresse;