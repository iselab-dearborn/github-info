const { Octokit } = require('@octokit/rest');
const dayjs = require('dayjs');
const gitUrlParse = require('git-url-parse');
const LoggerUtils = require("./logger-utils")

class ApiUtils {

    static async getCommits(api, project) {

        const since = dayjs().subtract(2, 'year')

        return api.request('GET /repos/{owner}/{repo}/commits?since={since}',{
            owner: project.owner,
            repo: project.name,
            since: since.toISOString()
        });
    }

    static async getRateLimits(githubKey = "") {

        const api = new Octokit({
            auth: githubKey
        });

        return api.request('GET /rate_limit');
    }

    static async getRepo(api, project) {

        await new Promise(resolve => setTimeout(resolve, 500));

        return api.request('GET /repos/{owner}/{repo}', {
            owner: project.owner,
            repo: project.name
        });
    }

    static async getTags(api, project) {

        await new Promise(resolve => setTimeout(resolve, 500));

        return api.paginate('GET /repos/{owner}/{repo}/tags', {
            owner: project.owner,
            repo: project.name
        });
    }

    static async getContributors(api, project) {

        await new Promise(resolve => setTimeout(resolve, 500));

        return api.paginate('GET /repos/{owner}/{repo}/contributors', {
            owner: project.owner,
            repo: project.name
        });
    }

    static getInfo(githubApiKey = "", project) {

        const api = new Octokit({
            auth: githubApiKey
        });

        return new Promise((resolve, reject) => {

            const p = gitUrlParse(project.url);

            ApiUtils.getRepo(api, p).then(response => {

                const info = response.data;

                Promise.all([
                    ApiUtils.getTags(api, p),
                    ApiUtils.getContributors(api, p),
                    ApiUtils.getCommits(api, p)
                ]).then(values => {

                    const tags = values[0];
                    const contributors = values[1];
                    const commits = values[2].data;

                    resolve({
                        info: info,
                        tags: tags,
                        contributors: contributors,
                        commits: commits
                    });

                }).catch(errors => {
                    reject(errors);
                });
            }).catch(errors => {
                reject(errors);
            });
        });
    }

    static run(db) {

        const settings = db.findAllSettings();

        const projects = db.findAllPending();

        LoggerUtils.info("Fetching %s projects", projects.length);

        projects.forEach(project => {

            ApiUtils.getInfo(settings.github_api_key, project).then((response) => {

                db.updateById(project.id, {
                    github_id: response.info.id,
                    full_name: response.info.full_name,
                    owner_name: response.info.owner.login,
                    repo_name: response.info.name,
                    html_url: response.info.html_url,
                    created_at: response.info.created_at,
                    updated_at: response.info.updated_at,
                    duration_in_days_from_created_at: dayjs().diff(dayjs(response.info.created_at), 'days'),
                    duration_in_days_from_updated_at: dayjs().diff(dayjs(response.info.updated_at), 'days'),
                    size_in_kb: response.info.size,
                    stars: response.info.stargazers_count,
                    open_issues: response.info.open_issues_count,
                    language: response.info.language,
                    tags_count: response.tags.length,
                    contributors_count: response.contributors.length,
                    commits_last_two_years_count: response.commits.length,
                    status: 2,
                    status_code: 200,
                    status_message: "Done"
                });

            }).catch(errors => {

                db.updateById(project.id, {
                    status: errors.status == 403 ? 1 : 3,
                    status_code: errors.status,
                    status_message: errors.message
                });
            })
        });
    }
}

module.exports = ApiUtils;
