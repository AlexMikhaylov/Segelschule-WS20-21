/**
 * Welche Kursleiter und wie viel in einer Kursperiode eingeplant sind.
 */

'use strict';

const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Kursplan_Mitarbeiter = sequelize.define('Kursplan_Mitarbeiter', {

    // id: {
    //     type: Sequelize.INTEGER,
    //     autoIncrement: true,
    //     allowNull: false,
    //     primaryKey: true
    // }
    
    //FK: kursplanId und mitarbeiterId zusammenhängende PK?

}, {
    tableName: 'kursplan_mitarbeiter'
});


module.exports = Kursplan_Mitarbeiter;