var sqlite3 = require("sqlite3").verbose();  // use sqlite
var dbFile = "funkollection.db";

// makes the object that represents the database in our code
var db = new sqlite3.Database(dbFile);

// If not, initialize it
var createSeriesTable = "CREATE TABLE IF NOT EXISTS popseries (id text, name text, PRIMARY KEY(id))";
var seriesNames = [
    {id: 1, name: "Marvel"},
    {id: 2, name: "Animation"},
]


db.run(createSeriesTable);

setTimeout(function(){
    for( let i = 0; i < seriesNames.length; ++i){
        db.run("INSERT INTO popseries (id, name) VALUES (?, ?)", [seriesNames[i].id, seriesNames[i].name]);
    }
}, 500);

