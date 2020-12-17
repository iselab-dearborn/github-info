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
            projects: [],
            settings: {
                github_api_key: "",
                take : 50,
            }
        }).write()
    }

    static paginate(array, page_size, page_number) {
        return array.slice((page_number - 1) * page_size, page_number * page_size);
    }

    findStatistics() {

        const projects = this.db.get('projects').value();

        const stats = {
            pending: 0,
            done: 0,
            error: 0,
            progress: 0
        }

        projects.forEach(project =>{

            if (project.status == 1) {
                stats.pending++;
            }else if (project.status == 2) {
                stats.done++;
            }else if (project.status == 3) {
                stats.error++;
            }

            if (project.status == 2 || project.status == 3) {
                stats.progress++;
            }
        });

        stats.progress = ((stats.progress / projects.length)*100).toFixed(0)

        return stats;
    }

    findAll(){
        return this.db.get('projects').value();
    }

    findAllPaginate(search = '', page = 1, pageSize = 10) {

        const projects = this.db.get('projects')
            .filter((project) => {

                if (search) {
                    return project.url.toLowerCase().includes(search.toLowerCase());
                }

                return true
            })
            .value();

        return DBUtils.paginate(projects, pageSize, page);
    }

    findByUrl(url) {

        return this.db.get('projects')
            .find({url: url})
            .value()
    }

    findAllPending() {

        const settings = this.findAllSettings();

        let projects = this.db.get('projects')
            .filter({status: STATUS.PENDING})
            .take(settings.take || 50)
            .value()

        return projects;
    }

    findAllSettings(){
        return this.db.get('settings')
            .value()
    }

    saveSettings(data){

        return this.db.get('settings')
            .assign(data)
            .write()
    }

    removeAll() {

        return this.db.get('projects')
            .remove()
            .write()
    }

    removeById(id) {

        return this.db.get('projects')
            .remove({ id: id })
            .write()
    }

    updateById(id, data) {

        this.db.get('projects')
            .find({ id: id })
            .assign(data)
            .write()
    }

    save(url) {

        const project = this.findByUrl(url);

        if (!project) {

            this.db.get('projects')
                .push({
                    id: uuid.v4(),
                    date: new Date(),
                    url: url,
                    github_id: '',
                    full_name: '',
                    owner_name: '',
                    repo_name: '',
                    html_url: '',
                    created_at: '',
                    updated_at: '',
                    size_in_kb: '',
                    stars: '',
                    open_issues: '',
                    tags_count: "",
                    contributors_count: "",
                    commits_last_two_years_count: "",
                    language: '',
                    status: STATUS.PENDING,
                    status_code: '',
                    status_message: "Pending"
                }).write()
        }
    }
}

const db = new DBUtils();

module.exports = db;
