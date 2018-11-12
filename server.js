require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const uniqid = require('uniqid');
const lowerCase = require('lower-case');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const saltRounds = 10;
const multer = require('multer');
const path = require('path');

var authTokenBlackList = [];

var multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
       cb(null, '/Users/Albert/Documents/GitHub/funkollection/funkollection-api/public/images')
    },
    filename: function (req, file, cb) {
        const funkopop = JSON.parse(req.body.funkopop);
        var name = funkopop.name;
        var series = funkopop.series.name;
        var category = funkopop.category.name;
        var number = funkopop.number;
        
        var ext = file.mimetype.split("/").pop();

        name = name.replace(/\s/g, '');
        series = series.replace(/\s/g, '');
        category = category.replace(/\s|:/g, '');

        
        const fileName = `${series}-${category}-${name}-${number}.${ext}`;


        cb(null, fileName)
    }
});

const upload = multer({
    storage: multerStorage,
    fileFilter: function (req, file, cb) {
      var filetypes = /jpeg|jpg|png/;
      var mimetype = filetypes.test(file.mimetype);
      var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb("Error: File upload only supports the following filetypes - " + filetypes);
    }
  });

var corsOptions = {
    origin: 'http://localhost:4200',
    optionsSuccessStatus: 200
}

var sqlite3 = require("sqlite3").verbose();  // use sqlite3
var dbFile = "funkollection.db";
var db = new sqlite3.Database(dbFile);  // new object, old DB

app.use(cors(corsOptions));

//limit required to upload images
app.use( bodyParser.json({limit: "50mb"}) );
app.use( bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}) );

app.listen(8000, () => {
    console.log('Server started!');
});



// used to authenticate users for api calls before doing them
function authenticateUser(req, res, next){
    var token = req.headers.authorization.split(' ')[1];

    if(authTokenBlackList.includes(token)){
        res.status(409).send(JSON.stringify({ statusCode: 400, message: "Invalid token." }));
    }

    else{
        var userInfo = decodeToken(token);
        if(userInfo.exp < moment().unix()){
            res.status(409).send(JSON.stringify({ statusCode: 400, message: "Invalid token." }));
        }
    }
    next();
}





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

app.route('/api/series').get(
    [authenticateUser,
    ( req, res ) => {
        
        db.all('SELECT * FROM popseries', (err, rows) => {
            if(err != null){
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to get series list." }));
            }   else {

                res.status(200);
                res.type("application/json");
                res.send(rows);
            }
        })
    }]
);

app.route('/api/series').post(
    [authenticateUser,
    ( req, res ) => {

        var reqBody = req.body;
        var series = reqBody.series;
        if(series == null || series.length == 0){
            res.status(400).send(JSON.stringify({ statusCode: 400, message: "Series format invalid." }));
        }
        
        var seriesID = uniqid();

        db.all('INSERT INTO popseries VALUES(?, ?)', [seriesID, series], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to save series" }));
            }   else {
                res.status(200).send(JSON.stringify({ statusCode: 200, seriesID: seriesID }));
            }
        })
    }]
);

app.route('/api/:seriesID/categories').get(
    [authenticateUser,
    ( req, res ) => {

        const seriesID = req.params['seriesID'];
        db.all('SELECT * FROM popcategory WHERE popcategory.series = ?', seriesID, (err, rows) => {
            if(err != null){
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to get categories list." }));
            }   else {
                res.status(200);
                res.type("application/json");
                res.send(rows);
            }
        })
    }]
);

app.route('/api/category').post(
    [authenticateUser,
    ( req, res ) => {

        var reqBody = req.body;
        var seriesID = reqBody.seriesID;
        var category = reqBody.category;

        if(seriesID == null || seriesID.length == 0){
            res.status(400).send(JSON.stringify({ statusCode: 400, message: "Series format invalid." }));
        }

        if(category == null || category.length == 0){
            res.status(400).send(JSON.stringify({ statusCode: 400, message: "Category format invalid." }));
        }
        
        var categoryID = uniqid();

        db.all('INSERT INTO popcategory VALUES(?, ?, ?)', [categoryID, category, seriesID], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to save category" }));
            }   else {
                res.status(200).send(JSON.stringify({ statusCode: 200, categoryID: categoryID }));
            }
        })
    }]
);

app.route('/api/funkopop/:name').get(( req, res ) => {
    const requestedPopName = req.params['name'];
    res.send({
        name: requestedPopName
    });
});


var multerUpload = upload.fields([{name: 'file', maxCount: 1}]);

app.route('/api/funkopop/upload').post(
    [authenticateUser,
    multerUpload, 
    ( req, res ) => {
        let image = req.files["file"][0].filename;

        const funkopop = JSON.parse(req.body.funkopop);

        var name = funkopop.name;
        var series = funkopop.series;
        var category = funkopop.category;
        var number = funkopop.number;
        
        if(name == null || name.length == 0 || series.id == null || series.id.length == 0 || category.id == null || category.id.length == 0 || number == null || number < 0 ){
            res.status(400).send(JSON.stringify({ statusCode: 400, message: "Invalid values." }));
        }

        var uniqueID = uniqid();

        db.all('INSERT INTO funkopop VALUES(?, ?, ?, ?, ?, ?) ', [uniqueID, series.id, category.id, name, number, image], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to save funko pop" }));
            }   else {
                res.status(200).send(JSON.stringify({ statusCode: 200, popID: uniqueID }));
            }
        })

    }]
);



app.route('/api/funkopop/:name').put(( req, res ) => {
    res.send( 200, req.body );
});

app.route('/api/funkopop/:name').delete(( req, res ) => {
    res.sendStatus(204);
});

app.route('/api/account/register').post(( req, res ) => {

    var reqBody = req.body;

    var username = lowerCase(reqBody.username);
    var email = lowerCase(reqBody.email);
    var firstName = reqBody.firstName;
    var lastName = reqBody.lastName;

    bcrypt.genSalt(saltRounds, (err, salt) => {
        
        var uniqueID = uniqid();

        bcrypt.hash(req.body.password, salt, (err, hash) => {
            db.all(
                "INSERT INTO users (ID, USERNAME, EMAIL, FIRST, LAST, SALT, PASSWORD) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                [uniqueID, username, email, firstName, lastName, salt, hash],
                (err, rows) => {
                    res.setHeader('Content-Type', 'application/json');
                    if(err){
                        res.status(409).send(JSON.stringify({ statusCode: 409, message: "Unable to register user." }));
                    }
                    else{
                        res.status(201).send(JSON.stringify({ statusCode: 201, message: "Success!" }));                    
                    }
                }
            );
        });
    });

});


app.route('/api/account/isEmailRegistered').post(( req, res ) => {
    var reqBody = req.body;
    var email = lowerCase(reqBody.email);

    db.all("SELECT * FROM users WHERE users.email = ?", [email], (err, rows) => {
        if(err){
            res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to check availability of email." }));
        }
        else{
            if(rows.length > 0){
                res.status(409).send(JSON.stringify({ statusCode: 409, message: "Email is already taken." }));
            }
            else{
                res.status(200).send(JSON.stringify({ statusCode: 200, message: "Email is available." }));

            }
        }
    });
});


app.route('/api/account/isUsernameRegistered').post(( req, res ) => {
    var reqBody = req.body;
    var username = lowerCase(reqBody.username);
    db.all("SELECT * FROM users WHERE users.username = ?", [username], (err, rows) => {
        if(err){
            res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to check availability of username." }));
        }
        else{
            if(rows.length > 0){
                res.status(409).send(JSON.stringify({ statusCode: 409, message: "Username is already taken." }));
            }
            else{
                res.status(200).send(JSON.stringify({ statusCode: 200, message: "Username is available." }));

            }
        }
    });
});

app.route('/api/account/login').post(( req, res ) => {
    var reqBody = req.body;
    var username = lowerCase(reqBody.username);
    var password = reqBody.password;

    db.all("SELECT * FROM users where users.username = ?", [username], (err, rows) => {
        if(err){
            res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to login." }));
        }
        else{
            if(rows.length > 0){

                bcrypt.compare(password, rows[0].password, (err, success) => {
                    if(err){
                        res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to login." }));
                    }
                    else{
                        if(success){

                            res.status(200).send(JSON.stringify(
                            { 
                                statusCode: 200, 
                                message: "Login success!",
                                token: encodeToken(rows[0].id),
                            }));
                        }
                        else{
                            res.status(409).send(JSON.stringify({ statusCode: 409, message: "Login failed. Try again" }));
                        }

                    }
                });
            }
            else{
                res.status(409).send(JSON.stringify({ statusCode: 409, message: "Login failed. Try again" }));
            }
        }
    });
});


app.route('/api/account/logout').post(( req, res ) => {
    var token = req.headers.authorization.split(' ')[1];
    authTokenBlackList.push(token);

    res.status(200).send(JSON.stringify(
        { 
            statusCode: 200, 
            message: "Logout success!"        
        }));

});



function encodeToken(userID){

    const payload = {
        exp: moment().add(7, "days").unix(),
        iat: moment().unix(),
        sub: userID

    }

    return jwt.sign(payload, process.env.TOKEN_SECRET);
}

function decodeToken(token){
    return jwt.verify(token, process.env.TOKEN_SECRET);
}



// checks the authTokenBlacklist every hour to remove expired tokens
setInterval(() => {
    console.log("Checking blacklisted tokens.");
    for(let i = 0; i < authTokenBlackList.length; ++i){
        var token = authTokenBlackList[i];
        var info = decodeToken(token);

        if(info.exp < moment().unix){
            authTokenBlackList.splice(token, 1);
        }
    }
}, 3600000);
