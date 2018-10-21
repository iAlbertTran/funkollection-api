var sqlite3 = require("sqlite3").verbose();  // use sqlite
var dbFile = "funkopop.db";

// makes the object that represents the database in our code
var db = new sqlite3.Database(dbFile);

// If not, initialize it
var createSeriesTable = "CREATE TABLE IF NOT EXISTS popseries (SERIESNAME text, PRIMARY KEY(SERIESNAME))";
var seriesNames = [
    'Heroes',
    'Marvel',
    'Star Wars',
    'Disney',
    'WWE',
    'Wrestling',
    'J.K. Rowling',
    'Game of Thrones',
    'Television',
    'Movies',
    'Animation',
    'Games',
    'AD Icons',
    'Rocks',
    'Comics',
    'Rides',
    'Board Games',
    'Sports',
    'Saturday Night Live',
    'South Park',
    'Marvel vs. Capcom',
    '8-Bit',
    'Muppets',
    'Seasame Street',
    'Pets',
    'My Little Pony',
    'Originals',
    'Freddy Funko',
    'Monsters',
    'Asia',
    'Conan O\'Brien',
    'Holiday',
    'Stan Lee',
    'Books',
    'Myths',
    'Royal Family',
    'Drag Queens',
    'The Vote',
    'Garbage Pal Kids',
    'Sanrio',
    'D.I.Y',
    'Classics',
    'Sci-Fi',
    'Ugly Dolls'
]


db.run(createSeriesTable);

setTimeout(function(){
    for( let i = 0; i < seriesNames.length; ++i){
        db.run("INSERT INTO popseries (SERIESNAME) VALUES (?)", [seriesNames[i]]);
    }
}, 500);

