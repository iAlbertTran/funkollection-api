const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

var corsOptions = {
    origin: 'http://example.com',
    optionsSuccessStatus: 200
}

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
                series: 'POP! Marvel',
                category: 'MS 10',
                series_number: 375
            },
            {
                name: 'Venomized Iron Man',
                series: 'Pop! Marvel',
                category: 'Marvel Venom',
                series_number: 365
            }
        ]
    });
});

app.route('/api/funkopop/:name').get(( req, res ) => {
    const requestedPopName = req.params['name'];
    res.send({
        name: requestedPopName
    });
});

api.route('/api/funkopop').post(( req, res ) => {
    res.send( 201, req.body );
});

app.route('/api/funkopop/:name').put(( req, res ) => {
    res.send( 200, req.body );
});

app.route('/api/funkopop/:name').delete(( req, res ) => {
    res.sendStatus(204);
});