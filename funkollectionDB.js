var sqlite3 = require("sqlite3").verbose();  // use sqlite
var dbFile = "funkollection.db";

// makes the object that represents the database in our code
var db = new sqlite3.Database(dbFile);

// If not, initialize it
var createSeriesTable = "CREATE TABLE IF NOT EXISTS popseries (id INTEGER, name TEXT, PRIMARY KEY(id, name))";
var createCategoryTable = "CREATE TABLE IF NOT EXISTS popcategory (id INTEGER, name TEXT, PRIMARY KEY(id, name))";
var createUsersTable = "CREATE TABLE IF NOT EXISTS users (id INTEGER, username TEXT, email TEXT, first TEXT, last TEXT, salt TEXT, password TEXT, verified INTEGER, PRIMARY KEY(id, username, email))";
var createFunkoPopTable = "CREATE TABLE IF NOT EXISTS funkopop (id INTEGER, series INTEGER, category INTEGER, name TEXT, number INTEGER, image BLOB, PRIMARY KEY(id, name), FOREIGN KEY(category) REFERENCES popcategory(id) FOREIGN KEY(series) REFERENCES popseries(id))";
var createUserFunkoPopTable = "CREATE TABLE IF NOT EXISTS usersfunkopops (id INTEGER PRIMARY KEY, userID INTEGER, series INTEGER, category INTEGER, name TEXT, number INTEGER, image BLOB, FOREIGN KEY(userID) REFERENCES users(id) FOREIGN KEY(series) REFERENCES popseries(id) FOREIGN KEY(category) REFERENCES popcategory(id))";

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

