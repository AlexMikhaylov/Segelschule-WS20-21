'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const Kurs = require('./models/Kurs');
const Buchung = require('./models/Buchung');
const Mitarbeiter = require('./models/Mitarbeiter');

const app = express();

//setting pug as a template engine
// app.set('view engine', 'pug');
// app.set('views', path.join(__dirname, 'views')); //setting folder with templates - views is a default name

//setting ejs as a template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); //handle all public requests, grant a read access to the file system, here to the folder public

// app.use('/admin', adminRoutes); //filtering the /admin/ path only
// app.use(shopRouter); // default / path

//handling 404 pages
app.use('/', async (req, res, next) => {
    try {
        const kurse = await Kurs.findAll();
        const mitarbeiter = await Mitarbeiter.findAll();

        res.render('index', {
            kurse: kurse,
            mitarbeiter: mitarbeiter
        });

    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
    
});

app.listen(3001);