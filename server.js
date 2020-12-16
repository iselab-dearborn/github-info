const express = require('express');
const bodyParser = require('body-parser');
const ApiUtils  = require('./src/api-utils');
const CSVUtils  = require('./src/csv-utils');
const db  = require('./src/db-utils');
const LoggerUtils = require("./src/logger-utils")
const { body, query, param, validationResult } = require('express-validator');

const PORT = process.env.PORT || 3000;

const routes = express.Router();
const app = express();

/** Settings */

app.use(express.static('public'));
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({ extended: false, limit: '100mb' }));

/** Routes */

routes.get('/', [], async (req, res) => {

    const settings = db.findAllSettings();

    try{

        const rateLimits = await ApiUtils.getRateLimits(settings.github_api_key);

        res.render('index.ejs',{
            stats: db.findStatistics(),
            rates: rateLimits.data.rate
        });
    }catch(error){
        res.redirect('/settings');
    }
});

routes.get('/projects', [
    query('search')
        .optional()
        .trim()
        .escape(),
    query('page')
        .optional()
        .isInt()
        .toInt(),
    query('pageSize')
        .optional()
        .isInt()
        .toInt()
], (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const search =  req.query.search || '';
    const page =  req.query.page || 1;
    const pageSize =  req.query.pageSize || 10;

    const nextPage = page + 1;
    const previousPage = page == 1 ? 1 : page - 1;

    res.render('projects.ejs',{
        projects: db.findAll(search, page, pageSize),
        search: search,
        page: page,
        pageSize: pageSize,
        nextPage: nextPage,
        previousPage: previousPage
    });
});

routes.get('/settings', (req, res) => {

    res.render('settings.ejs',{
        settings: db.findAllSettings()
    });
});

routes.post('/settings/save', [
    body('github_api_key')
        .optional()
        .trim()
        .escape(),
    body('take')
        .not().isEmpty()
        .trim()
        .isInt()
        .toInt()
],(req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    db.saveSettings({
        "github_api_key": req.body.github_api_key || '',
        "take": req.body.take || 12
    });

    res.redirect('/settings');
});

routes.get('/add-projects', (req, res) => {
    res.render('add-projects.ejs');
});

routes.get('/generate', (req, res) => {
    res.redirect('/');
});

routes.post('/projects/remove-all', (req, res) => {

    LoggerUtils.info('Removing all');

    db.removeAll();

    res.redirect('/');
});

routes.post('/projects/delete/:projectId', [
    param('projectId')
        .not().isEmpty()
        .trim()
], (req, res) => {

    db.removeById(req.params.projectId);

    res.redirect('/projects');
});

routes.get('/export', (req, res) => {

    res.render('export.ejs');
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
        db.save(url);
    });

    res.redirect('/projects');
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
