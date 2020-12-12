const { Octokit } = require('@octokit/rest');
const dayjs = require('dayjs');
const gitUrlParse = require('git-url-parse');

class ApiUtils {

    static getRepo(api, project) {

        return api.request('GET /repos/{owner}/{repo}', {
            owner: project.owner,
            repo: project.name
        });
    }

    static getTags(api, project) {

        return api.paginate('GET /repos/{owner}/{repo}/tags', {
            owner: project.owner,
            repo: project.name
        });
    }

    static getContributors(api, project) {

        return api.paginate('GET /repos/{owner}/{repo}/contributors', {
            owner: project.owner,
            repo: project.name
        });
    }

    static getInfo(key, url) {

        const api = new Octokit({
            auth: key
        });

        return new Promise((resolve, reject) => {

            const project = gitUrlParse(url);

            ApiUtils.getRepo(api, project).then(response => {

                const info = response.data;

                Promise.all([
                    ApiUtils.getTags(api, project),
                    ApiUtils.getContributors(api, project)
                ]).then(values => {

                    const tags = values[0];
                    const contributors = values[1];

                    resolve({
                        'id': info.id,
                        'full_name': info.full_name,
                        'owner_name': info.owner.login,
                        'repo_name': info.name,
                        'html_url': info.html_url,
                        'created_at': info.created_at,
                        'updated_at': info.updated_at,
                        'repo_duration_in_days': dayjs().diff(dayjs(info.created_at), 'days'),
                        'repo_duration_in_months': dayjs().diff(dayjs(info.created_at), 'months'),
                        'size_in_kb': info.size,
                        'stars': info.stargazers_count,
                        'open_issues': info.open_issues_count,
                        'tags': tags.length,
                        'contributors': contributors.length,
                        'error_message': ''
                    });
                }).catch(errors => {
                    resolve({
                        'id': undefined,
                        'full_name': project.owner + '/' + project.repo,
                        'owner_name': project.owner,
                        'repo_name': project.repo,
                        'error_message': errors
                    });
                });
            }).catch(errors => {
                resolve({
                    'id': undefined,
                    'full_name': `${project.owner}/${project.repo}`,
                    'owner_name': project.owner,
                    'repo_name': project.repo,
                    'error_message': errors
                });
            });
        });
    }
}

module.exports = ApiUtils;
