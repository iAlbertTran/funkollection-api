const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
var uniqid = require('uniqid');

const saltRounds = 10;

var corsOptions = {
    origin: 'http://localhost:4200',
    optionsSuccessStatus: 200
}

var sqlite3 = require("sqlite3").verbose();  // use sqlite3
var dbFile = "funkollection.db";
var db = new sqlite3.Database(dbFile);  // new object, old DB

app.use(cors(corsOptions));
app.use( bodyParser.json() );

app.listen(8000, () => {
    console.log('Server started!');
});

app.route('/api/funkopop').get(( req, res ) => {
    res.send({
        vinyls: [
            {
                name: 'Iron Man (Gold Chrome)',
                series: 'Marvel',
                category: 'MS-10',
                series_number: 375
            },
            {
                name: 'Venomized Iron Man',
                series: 'Marvel',
                category: 'Venom',
                series_number: 365
            }
        ]
    });
});

app.route('/api/series').get(( req, res ) => {
    db.all('SELECT * FROM popseries', function(err, rows){
        if(err != null){
            console.log(err);
        }   else {
            res.status(200);
            res.type("application/json");
            res.send(rows);
        }
    })

});

app.route('/api/funkopop/:name').get(( req, res ) => {
    const requestedPopName = req.params['name'];
    res.send({
        name: requestedPopName
    });
});

app.route('/api/funkopop').post(( req, res ) => {
    res.send( 201, req.body );
});

app.route('/api/funkopop/:name').put(( req, res ) => {
    res.send( 200, req.body );
});

app.route('/api/funkopop/:name').delete(( req, res ) => {
    res.sendStatus(204);
});

app.route('/api/account/register').post(( req, res ) => {

    var reqBody = req.body;

    var username = reqBody.username;
    var email = reqBody.email;
    var firstName = reqBody.firstName;
    var lastName = reqBody.lastName;

    bcrypt.genSalt(saltRounds, (err, salt) => {
        
        var uniqueID = uniqid(username);

        bcrypt.hash(req.body.password, salt, (err, hash) => {
            db.all(
                "INSERT INTO users (ID, USERNAME, EMAIL, FIRST, LAST, SALT, PASSWORD) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                [uniqueID, username, email, firstName, lastName, salt, hash],
                (err, rows) => {
                    res.setHeader('Content-Type', 'application/json');
                    if(err){
                        res.status(409).send(JSON.stringify({ message: "Unable to register user." }));
                    }
                    else{
                        res.status(201).send(JSON.stringify({ message: "Success!" }));                    
                    }
                }
            );
        });
    });

});
