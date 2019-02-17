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
const fs = require('fs');
const imagePath = "./public/images/";
const request = require('request');
const rp = require('request-promise');

var authTokenBlackList = [];

var multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
       cb(null, './public/images')
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
    origin: ['http://localhost:4200', 'https://ialberttran.github.io/funkollection'],
    optionsSuccessStatus: 200
}

var sqlite3 = require("sqlite3").verbose();  // use sqlite3
var dbFile = "funkollection.db";
var db = new sqlite3.Database(dbFile);  // new object, old DB


let ebayCompletedBaseURL = `https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findCompletedItems&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=AlbertTr-funkolle-PRD-18dd99240-e24114f0&GLOBAL-ID=EBAY-US&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD&keywords=`

let ebay_US_ONLY = '&itemFilter.name=LocatedIn&itemFilter.value=US';
let ebay_SoldItemsOnly = '&itemFilter.name=SoldItemsOnly&itemFilter.value=true';
let ebay_SortByEndDate = '&sortOrder=EndTimeSoonest';
let ebayBaseURLending = `&paginationInput.entriesPerPage=`;

//app.use(cors(corsOptions));
app.use(cors());

//limit required to upload images
app.use( bodyParser.json({limit: "50mb"}) );
app.use( bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}) );

app.listen(process.env.PORT || 8000, () => {
    console.log('Server started!');
});



// used to authenticate users for api calls before doing them
function authenticateUser(req, res, next){
    let token = req.headers.authorization.split(' ')[1];
    if(authTokenBlackList.includes(token)){
        res.status(409).send(JSON.stringify({ statusCode: 409, message: "Invalid token." }));
    }

    let userInfo = decodeToken(token);

    if(userInfo.exp < moment().unix()){
        res.status(409).send(JSON.stringify({ statusCode: 409, message: "Invalid token." }));
    }
    
    req.userID = userInfo.sub;
    next();
}



app.route('/api/funkopop').get(
    [authenticateUser,
    ( req, res ) => {
        db.all(`SELECT *, funkopop.id AS id, funkopop.name AS name, popseries.name AS series, popcategory.name AS category FROM funkopop 
                    INNER JOIN popseries ON funkopop.series = popseries.id 
                    INNER JOIN popcategory ON funkopop.category = popcategory.id`, (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to fetch Funko Pops." }));
            }   else {
                res.status(200).send(JSON.stringify({ statusCode: 200, funkopops: rows }));
            }
        });
    }]
);

app.route('/api/funkopop/random/:count').get(
    [authenticateUser,
    ( req, res ) => {
        const count = req.params['count']; 

        db.all(`SELECT *, funkopop.id AS id, funkopop.name AS name, popseries.name AS series, popcategory.name AS category FROM funkopop 
                    INNER JOIN popseries ON funkopop.series = popseries.id 
                    INNER JOIN popcategory ON funkopop.category = popcategory.id
                ORDER BY RANDOM() LIMIT ?`,[count], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to fetch Funko Pops." }));
            }   else {
                res.status(200).send(JSON.stringify({ statusCode: 200, funkopops: rows }));
            }
        });
    }]
);

app.route('/api/funkopop/series/:series').get(
    [authenticateUser,
    ( req, res ) => {

        const series = req.params['series']; 

        db.all(`SELECT *, individualpop.id AS id, individualpop.name AS name, popseries.name AS series, popcategory.name AS category FROM
                    (SELECT * FROM funkopop WHERE funkopop.series = ?)
                AS individualpop
                INNER JOIN popseries ON individualpop.series = popseries.id
                INNER JOIN popcategory ON individualpop.category = popcategory.id
                ORDER BY individualpop.series, individualpop.category, individualpop.name ASC`, [series], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to fetch Funko Pops." }));
            }   else {
                res.status(200).send(JSON.stringify({ statusCode: 200, funkopops: rows }));
            }
        });
    }]
);

app.route('/api/funkopop/category/:category').get(
    [authenticateUser,
    ( req, res ) => {

        const category = req.params['category']; 

        db.all(`SELECT *, individualpop.id AS id, individualpop.name AS name, popseries.name AS series, popcategory.name AS category FROM
                    (SELECT * FROM funkopop WHERE funkopop.category = ?)
                AS individualpop
                INNER JOIN popseries ON individualpop.series = popseries.id
                INNER JOIN popcategory ON individualpop.category = popcategory.id
                ORDER BY individualpop.series, individualpop.category, individualpop.name ASC`, [category], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to fetch Funko Pops." }));
            }   else {
                res.status(200).send(JSON.stringify({ statusCode: 200, funkopops: rows }));
            }
        });
    }]
);

app.route('/api/funkopop/:series/:category/:name').get(
    [authenticateUser,
    ( req, res ) => {

        const series = insertWildCard(req.params['series']); 
        const category = insertWildCard(req.params['category']);
        const name = insertWildCard(req.params['name']);
        console.log(series, category, name);


        db.all(`SELECT *, individualpop.id AS id, individualpop.name AS name, popseries.name AS seriesName, popcategory.name AS categoryName FROM
                    (SELECT * FROM funkopop WHERE funkopop.series = 
                        (SELECT id FROM popseries WHERE LOWER(popseries.name) LIKE ?) AND funkopop.category = 
                        (SELECT id FROM popcategory WHERE LOWER(popcategory.name) LIKE ?) AND LOWER(funkopop.name) LIKE ?)
                AS individualpop
                INNER JOIN popseries ON individualpop.series = popseries.id
                INNER JOIN popcategory ON individualpop.category = popcategory.id LIMIT 1`, [series, category, name], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to fetch funko pop." }));
            }   else {
                if(rows.length > 0)
                    res.status(200).send(JSON.stringify({ statusCode: 200, funkopop: rows[0] }));
                else
                    res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to fetch funko pop." }));

            }
        });
    }]
);


app.route('/api/funkopop/:image').get(
    ( req, res ) => {
        const image = req.params['image'];  
        
        fs.access(imagePath + image, fs.F_OK, (err) => {
            if (err) {
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to fetch image." }));
            }
            res.status(200).sendFile(`public/images/${image}`, { root: '.' });
            //file exists
          })

    }
);

app.route('/api/users/:user/collection/all').get(
    [authenticateUser,
    ( req, res ) => {
        const userID = req.userID;

        db.all(`SELECT *, funkopop.id AS id, funkopop.name AS name, popseries.name AS series, popcategory.name AS category FROM funkopop 
                INNER JOIN popseries ON funkopop.series = popseries.id 
                INNER JOIN popcategory ON funkopop.category = popcategory.id
                INNER JOIN (SELECT * FROM usercollection WHERE usercollection.userID = ?) AS usercollection ON usercollection.funkopopID = funkopop.id`, [userID], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to get users Pop! Vinyl collection." }));
            }   else {
                console.log(rows);
                res.status(200).send(JSON.stringify({ statusCode: 200, funkopops: rows}));
            }
        });
    }]
);

app.route('/api/users/:user/collection/id').get(
    [authenticateUser,
    ( req, res ) => {
        const userID = req.userID;

        db.all('SELECT funkopopID FROM usercollection WHERE usercollection.userID = ?', [userID], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to get users Pop! Vinyl collection." }));
            }   else {
                let array = [];
                rows.forEach((funkopop) => {
                    array.push(funkopop.funkopopID);
                });

                res.status(200).send(JSON.stringify({ statusCode: 200, funkopops: array}));
            }
        });
    }]
);

app.route('/api/users/:user/collection/add/:popID').post(
    [authenticateUser,
    ( req, res ) => {
        const popID = req.params['popID'];        
        const userID = req.userID;

        db.all('INSERT INTO usercollection VALUES(?, ?)', [userID, popID], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to add Pop! Vinyl to collection." }));
            }   else {
                res.status(200).send(JSON.stringify({ statusCode: 200}));
            }
        });
    }]
);

app.route('/api/users/:user/collection/remove/:popID').delete(
    [authenticateUser,
    ( req, res ) => {
        const popID = req.params['popID'];        
        const userID = req.userID;

        db.all('DELETE FROM usercollection WHERE usercollection.userID = ? AND usercollection.funkopopID = ?', [userID, popID], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to remove Pop! Vinyl from collection." }));
            }   else {
                res.status(200).send(JSON.stringify({ statusCode: 200}));
            }
        });
    }]
);

app.route('/api/users/:user/wishlist/all').get(
    [authenticateUser,
    ( req, res ) => {
        const userID = req.userID;

        db.all(`SELECT *, funkopop.id AS id, funkopop.name AS name, popseries.name AS series, popcategory.name AS category FROM funkopop 
                INNER JOIN popseries ON funkopop.series = popseries.id 
                INNER JOIN popcategory ON funkopop.category = popcategory.id
                INNER JOIN (SELECT * FROM userwishlist WHERE userwishlist.userID = ?) AS userwishlist ON userwishlist.funkopopID = funkopop.id`, [userID], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to get users Pop! Vinyl wishlist." }));
            }   else {
                res.status(200).send(JSON.stringify({ statusCode: 200, funkopops: rows}));
            }
        });
    }]
);

app.route('/api/users/:user/wishlist/id').get(
    [authenticateUser,
    ( req, res ) => {
        const userID = req.userID;

        db.all('SELECT funkopopID FROM userwishlist WHERE userwishlist.userID = ?', [userID], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to get users Pop! Vinyl wishlist." }));
            }   else {
                let array = [];
                rows.forEach((funkopop) => {
                    array.push(funkopop.funkopopID);
                });

                res.status(200).send(JSON.stringify({ statusCode: 200, funkopops: array}));
            }
        });
    }]
);

app.route('/api/users/:user/wishlist/add/:popID').post(
    [authenticateUser,
    ( req, res ) => {
        const popID = req.params['popID'];        
        const userID = req.userID;

        db.all('INSERT INTO userwishlist VALUES(?, ?)', [userID, popID], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to add Pop! Vinyl to wishlist." }));
            }   else {
                res.status(200).send(JSON.stringify({ statusCode: 200}));
            }
        });
    }]
);

app.route('/api/users/:user/wishlist/remove/:popID').delete(
    [authenticateUser,
    ( req, res ) => {
        const popID = req.params['popID'];        
        const userID = req.userID;

        db.all('DELETE FROM userwishlist WHERE userwishlist.userID = ? AND userwishlist.funkopopID = ?', [userID, popID], (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to remove Pop! Vinyl from wishlist." }));
            }   else {
                res.status(200).send(JSON.stringify({ statusCode: 200}));
            }
        });
    }]
);

app.route('/api/funkopop/:username').get(
    [authenticateUser,
    ( req, res ) => {
        const username = req.params['username'];
        db.all('SELECT * FROM usersfunkopops', (err, rows) =>{
            if(err){
                console.log(err);
                res.status(400).send(JSON.stringify({ statusCode: 400, message: "Unable to get users Pop! Vinyls" }));
            }   else {
                console.log(rows);
                res.status(200).send(JSON.stringify({ statusCode: 200, seriesID: seriesID }));
            }
        })
    }]
);

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
        console.log(1);
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


function insertWildCard(text){
    return text
        .replace(/ /g, '%')
        .replace(/-/g, '%')
        + '%';

}


// checks the authTokenBlacklist every hour to remove expired tokens
setInterval(() => {
    checkTokens();
}, 3600000);

function checkTokens(){
    console.log("Checking blacklisted tokens.");
    for(let i = 0; i < authTokenBlackList.length; ++i){
        var token = authTokenBlackList[i];
        var info = decodeToken(token);

        if(info.exp < moment().unix){
            authTokenBlackList.splice(token, 1);
        }
    }
}

setTimeout(() => {

    updateTrendingValues();
    
}, 1000);

setInterval(() => {
    updateTrendingValues();
}, 60000 * 60 * 12);

function updateTrendingValues(){
    console.log("Updating values");

    //to get tuples where it was last updated 24 hours ago
    let last24 = Date.now() - (60000 * 60 * 24);

    db.all(`SELECT *, funkopop.id AS id, funkopop.name AS name, popseries.name AS series, popcategory.name AS category 
            FROM funkopop 
                INNER JOIN popseries ON funkopop.series = popseries.id 
                INNER JOIN popcategory ON funkopop.category = popcategory.id
            WHERE funkopop.last_update IS NULL OR funkopop.last_update < ? `, [last24], (err, rows) =>{
        if(err){
            console.log(err);
        }   else {
            if(rows.length <= 0){
                console.log('No tuples to update');
                return;
            }

            rows.forEach((funkopop) => {
                queryEbay(funkopop, Date.now());
            });
        }
    });
}

function queryEbay(funkopop, currTimestamp){

    let popId = funkopop.id;

    let searchText = `Funko pop ${funkopop.name} ${funkopop.number}`;
    searchText = searchText.replace(/\s/g, '%20');
    searchText = searchText.replace(/\&/g, "");

    let options = {
        url: `${ebayCompletedBaseURL}${searchText}${ebayBaseURLending}1000${ebay_US_ONLY}${ebay_SoldItemsOnly}${ebay_SortByEndDate}`,
        json: true
    };
    
    rp(options).then((response) => {
        let results = response.findCompletedItemsResponse[0].searchResult[0];
        let count = results['@count'];
        let items = results.item;
        let salePrice = 0;

        items.forEach((listing) =>{
            salePrice += parseInt(listing.sellingStatus[0].convertedCurrentPrice[0].__value__);
        });

        let trendingValue = (salePrice / count).toFixed(2);
        
        db.all(`UPDATE funkopop SET value = ?, last_update = ? WHERE funkopop.id = ?`, [trendingValue, currTimestamp, popId], (err, rows) =>{
            if(err){
                console.log(`Unable to update value for: ${funkopop.series} ${funkopop.category} ${funkopop.name}`);
                console.log(err);
            } else{
                console.log("Value update success!");

            }
        });

        return;
    }).catch(function (err) {
        console.log(err);
    });
}

//43200000
