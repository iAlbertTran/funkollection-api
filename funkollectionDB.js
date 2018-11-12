var sqlite3 = require("sqlite3").verbose();  // use sqlite
var dbFile = "funkollection.db";

const bcrypt = require('bcrypt');
var uniqid = require('uniqid');
const saltRounds = 10;

// makes the object that represents the database in our code
var db = new sqlite3.Database(dbFile);

// If not, initialize it
var createSeriesTable = "CREATE TABLE IF NOT EXISTS popseries (id TEXT UNIQUE, name TEXT UNIQUE, PRIMARY KEY(name))";
var createCategoryTable = "CREATE TABLE IF NOT EXISTS popcategory (id TEXT UNIQUE, name TEXT UNIQUE, series TEXT, PRIMARY KEY(name, series), FOREIGN KEY(series) REFERENCES series(id))";
var createUserTypeTable = "CREATE TABLE IF NOT EXISTS usertype (id INTEGER, name TEXT, PRIMARY KEY(id))";
var createUsersTable = "CREATE TABLE IF NOT EXISTS users (id TEXT UNIQUE, type INTEGER DEFAULT 0, username TEXT UNIQUE, email TEXT UNIQUE, first TEXT, last TEXT, salt TEXT, password TEXT, resetpassword INTEGER DEFAULT 0, verified INTEGER DEFAULT 0, PRIMARY KEY(username, email), FOREIGN KEY(type) REFERENCES usertype(id))";
var createFunkoPopTable = "CREATE TABLE IF NOT EXISTS funkopop (id TEXT UNIQUE, series INTEGER, category INTEGER, name TEXT, number INTEGER, image BLOB, PRIMARY KEY(series, category, name, number), FOREIGN KEY(category) REFERENCES popcategory(id) FOREIGN KEY(series) REFERENCES popseries(id))";
var createUserFunkoPopTable = "CREATE TABLE IF NOT EXISTS usersfunkopops (id TEXT PRIMARY KEY UNIQUE, userID INTEGER, funkoPopID TEXT, image BLOB, favorite INTEGER, wishlist INTEGER, FOREIGN KEY(userID) REFERENCES users(id)  FOREIGN KEY(funkoPopID) REFERENCES funkopop(id))";

var userTypes = [
    {id: 0, name: "Normal"},
    {id: 1, name: "Admin"}  
]


db.run(createSeriesTable);

db.run(createCategoryTable);

db.run(createUserTypeTable);

db.run(createUsersTable);

db.run(createFunkoPopTable);

db.run(createUserFunkoPopTable);


setTimeout(function(){

    for( let i = 0; i < userTypes.length; ++i){
        db.run("INSERT INTO usertype (ID, NAME) VALUES (?, ?)", [userTypes[i].id, userTypes[i].name]);
    }

    bcrypt.genSalt(saltRounds, (err, salt) => {
        
        var uniqueID = uniqid("admin");

        bcrypt.hash("Funkollector!", salt, (err, hash) => {
            db.all(
                "INSERT INTO users (ID, TYPE, USERNAME, EMAIL, FIRST, LAST, SALT, PASSWORD) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
                [uniqueID, 1, "admin", "albtran@ucdavis.edu", "Albert", "Tran", salt, hash],
                (err, rows) => {
                }
            );
        });
    });
}, 500);

