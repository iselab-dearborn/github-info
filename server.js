const express = require('express');
const bodyParser = require('body-parser');
const ApiUtils  = require('./src/api-utils');
const CSVUtils  = require('./src/csv-utils');

const PORT = process.env.PORT || 3000;

const routes = express.Router();
const app = express();

/** Settings */

app.use(express.static('public'));
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({ extended: false }));

/** Routes */

routes.get('/', (req, res) => {
    res.render('index.ejs');
});

routes.get('/generate', (req, res) => {
    res.redirect('/');
});

routes.post('/generate', (req, res) => {

    let key = req.body.key || '';
    let urls = req.body.urls || [];

    key = key.trim();

    if (urls.length === 0) {
        res.redirect('/');
        return;
    }

    urls = urls.split('\n');

    let premises = urls
        .filter(url => url)
        .map(url => url.trim())
        .filter(url => url)
        .map(url => {
            return ApiUtils.getInfo(key, url);
        });

    Promise.all(premises).then(data => {
        res.attachment('info.csv');
        res.type('csv');
        res.send(CSVUtils.export(data));
    });
});

app.use('/', routes);

app.use('*', function (req, res) {
    res.send('Page not found');
});

app.listen(PORT, () => {
    console.log('Running on port: %d', PORT);
});
