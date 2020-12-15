const uuid = require('node-uuid');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')

const STATUS = Object.freeze({
    "PENDING": 1,
    "DONE": 2,
    "ERROR": 3
});

class DBUtils {

    constructor() {
        this.db = low(adapter);
        this.db.defaults({
                projects: []
            }).write()
    }

    findAll() {

        return this.db.get('projects').value();
    }

    findByUrl(url) {

        return this.db.get('projects')
            .find({ url: url })
            .value()
    }

    findAllPending(){

        let projects = this.db.get('projects')
            .filter({status: STATUS.PENDING })
            .take(40)
            .value()

        if (projects.length == 0){

            projects = this.db.get('projects')
                .filter({status_code: 403 })
                .take(40)
                .value()
        }

        return projects;
    }

    removeById(id) {

        return this.db.get('projects')
            .remove({id: id})
            .write()
    }

    updateById(id, data){

        this.db.get('projects')
            .find({id: id})
            .assign(data)
            .write()
    }

    save(apiKey, url) {

        const project = this.findByUrl(url);

        if (!project) {

            this.db.get('projects')
                .push({
                    id: uuid.v4(),
                    api_key: apiKey,
                    url: url,
                    github_id: '',
                    full_name: '',
                    owner_name: '',
                    repo_name: '',
                    html_url: '',
                    created_at: '',
                    updated_at: '',
                    repo_duration_in_days: '',
                    repo_duration_in_months: '',
                    size_in_kb: '',
                    stars: '',
                    open_issues: '',
                    tags_count: "",
                    contributors_count: "",
                    language: '',
                    status: STATUS.PENDING,
                    status_code: '',
                    status_message: ""
                }).write()
        }
    }
}

const db = new DBUtils();

module.exports = db;
