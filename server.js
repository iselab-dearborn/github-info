const express = require('express');
const bodyParser = require('body-parser');
const ApiUtils  = require('./src/api-utils');
const CSVUtils  = require('./src/csv-utils');
const db  = require('./src/db-utils');
const LoggerUtils = require("./src/logger-utils")
const { body, validationResult } = require('express-validator');

const PORT = process.env.PORT || 3000;

const routes = express.Router();
const app = express();

/** Settings */

app.use(express.static('public'));
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({ extended: false, limit: '100mb' }));

/** Routes */

routes.get('/', (req, res) => {
    res.render('index.ejs',{
        projects: db.findAll()
    });
});

routes.get('/submit', (req, res) => {
    res.render('submit.ejs');
});

routes.get('/generate', (req, res) => {
    res.redirect('/');
});

routes.post('/projects/delete/:projectId', (req, res) => {

    db.removeById(req.params.projectId);

    res.redirect('/');
});

routes.post('/projects/export', (req, res) => {

    res.attachment('info.csv');
    res.type('csv');
    res.send(CSVUtils.export(db.findAll()));
});

routes.post('/save', [
    body('key')
        .trim()
        .escape(),
    body('urls')
        .not().isEmpty()
        .trim()
],(req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let urls = req.body.urls || [];

    urls = urls.split("\n")
                .filter(url => url)
                .map(url => url.trim())
                .filter(url => url.length !== 0);

    urls.forEach((url) => {
        db.save(req.body.key, url);
    });

    res.redirect('/');

    // let key = req.body.key || '';
    // let urls = req.body.urls || [];

    // key = key.trim();

    // if (urls.length === 0) {
    //     res.redirect('/');
    //     return;
    // }

    // Promise.all(premises).then(data => {
    //     res.attachment('info.csv');
    //     res.type('csv');
    //     res.send(CSVUtils.export(data));
    // });
});

app.use('/', routes);

app.use('*', function (req, res) {
    res.send('Page not found');
});

app.listen(PORT, () => {

    LoggerUtils.info('Running on port: %d', PORT);

    const sec = 1000;
    const min = 60 * sec;

    setInterval(function() {
        ApiUtils.run(db);
    }, 1 * min);
});
