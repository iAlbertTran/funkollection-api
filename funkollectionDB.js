var sqlite3 = require("sqlite3").verbose();  // use sqlite
var dbFile = "funkollection.db";

// makes the object that represents the database in our code
var db = new sqlite3.Database(dbFile);

// If not, initialize it
var createSeriesTable = "CREATE TABLE IF NOT EXISTS popseries (id TEXT UNIQUE, name TEXT UNIQUE, PRIMARY KEY(name))";
var createCategoryTable = "CREATE TABLE IF NOT EXISTS popcategory (id TEXT UNIQUE, name TEXT UNIQUE, PRIMARY KEY(id, name))";
var createUsersTable = "CREATE TABLE IF NOT EXISTS users (id TEXT UNIQUE, username TEXT UNIQUE, email TEXT UNIQUE, first TEXT, last TEXT, salt TEXT, password TEXT, resetpassword INTEGER DEFAULT 0, verified INTEGER DEFAULT 0, PRIMARY KEY(id, username, email))";
var createFunkoPopTable = "CREATE TABLE IF NOT EXISTS funkopop (id TEXT UNIQUE, series INTEGER, category INTEGER, name TEXT, number INTEGER, image BLOB, PRIMARY KEY(id, name), FOREIGN KEY(category) REFERENCES popcategory(id) FOREIGN KEY(series) REFERENCES popseries(id))";
var createUserFunkoPopTable = "CREATE TABLE IF NOT EXISTS usersfunkopops (id TEXT PRIMARY KEY UNIQUE, userID INTEGER, series INTEGER, category INTEGER, name TEXT, number INTEGER, image BLOB, FOREIGN KEY(userID) REFERENCES users(id) FOREIGN KEY(series) REFERENCES popseries(id) FOREIGN KEY(category) REFERENCES popcategory(id))";

var seriesNames = [
    {id: 1, name: "Marvel"},
    {id: 2, name: "Animation"},
]


db.run(createSeriesTable);

db.run(createCategoryTable);

db.run(createUsersTable);

db.run(createFunkoPopTable);

db.run(createUserFunkoPopTable);


setTimeout(function(){
    for( let i = 0; i < seriesNames.length; ++i){
        db.run("INSERT INTO popseries (ID, NAME) VALUES (?, ?)", [seriesNames[i].id, seriesNames[i].name]);
    }
}, 500);

