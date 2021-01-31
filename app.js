'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const fileupload = require('express-fileupload');

const path = require('path');

const app = express();

const flash = require('express-flash');
const session = require('express-session');



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


//importing routers
const kursRouter = require('./routes/kurse');
const kundeRouter = require('./routes/kunden');
const mitarbeiterRouter = require('./routes/mitarbeiter');
const dashboardRouter = require('./routes/dashboard');

const sequelize = require('./util/database');

//setting the database model
const Kurs = require('./models/Kurs');
const Mitarbeiter = require('./models/Mitarbeiter');
const Adresse = require('./models/Adresse');
const Kunde = require('./models/Kunde');
const Termin = require('./models/Termin');
const Buchung = require('./models/Buchung');
const Kursplan = require('./models/Kursplan');
const Kursplan_Mitarbeiter = require('./models/Kursplan_Mitarbeiter');

//adding body parser
app.use(bodyParser.urlencoded({extended: true}));
//access to the public folder for images, css and js files
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
    name: 'my_session',
    secret: 'my_secret',
    resave: false
}));
app.use(flash());

app.use(fileupload({
    createParentPath: true
}));

app.use(kursRouter);
app.use(kundeRouter);
app.use(mitarbeiterRouter);
app.use(dashboardRouter);

//404 page
app.use('/', (req, res, next) => {
    // console.log(req.url);
    return res.status(404).render('admin-theme/404', {
        pageTitle: 'Seite nicht gefunden',
        path: ''
    });
    // res.redirect('/');
});


//-------------------------------------------- setting up the relations ------------------------------------
//Adresse - Mitarbeiter n:1
Mitarbeiter.hasMany(Adresse, { constraints: true, onDelete: 'CASCADE' });
Adresse.belongsTo(Mitarbeiter, { constraints: true, onDelete: 'CASCADE' });

// //Adresse - Kunde n:1
Kunde.hasMany(Adresse, { constraints: true, onDelete: 'CASCADE' });
Adresse.belongsTo(Kunde, {constraints: true, onDelete: 'CASCADE'} );

//Kunde - Kurse n:m via Buchungen
Kunde.belongsToMany(Kursplan, { constraints: true, onDelete: 'CASCADE', through: Buchung });
Kursplan.belongsToMany(Kunde, { constraints: true, onDelete: 'CASCADE', through: Buchung });

Kunde.hasMany(Buchung);
Buchung.belongsTo(Kunde);

Kursplan.hasMany(Buchung);
Buchung.belongsTo(Kursplan);

//Mitarbeiter - Kursplan n:m
Mitarbeiter.belongsToMany(Kursplan, { constraints: true, onDelete: 'CASCADE', through: Kursplan_Mitarbeiter });
Kursplan.belongsToMany(Mitarbeiter, { constraints: true, onDelete: 'CASCADE', through: Kursplan_Mitarbeiter });

Mitarbeiter.hasMany(Kursplan_Mitarbeiter);
Kursplan_Mitarbeiter.belongsTo(Mitarbeiter);

Kursplan.hasMany(Kursplan_Mitarbeiter);
Kursplan_Mitarbeiter.belongsTo(Kursplan);

//Kurs - Kursplan 1-n
Kursplan.belongsTo(Kurs, { constraints: true, onDelete: 'CASCADE' });
Kurs.hasMany(Kursplan, { constraints: true, onDelete: 'CASCADE' });

//Termine - Kursplan
Kursplan.hasMany(Termin, { constraints: true, onDelete: 'CASCADE' });
Termin.belongsTo(Kursplan, { constraints: true, onDelete: 'CASCADE' });

//------------------------------------------------------------------------------

sequelize
// .sync({ force: true })
.sync()
.then((result) => {
    app.listen(3000);
})
.catch(err => {
    console.log(err);
});