import _ from 'lodash';
import superagent from 'superagent';
import opa from 'object-path';

import actions from '../../actions/appActions.js';

import config from '../../../config.js';
import graphqlQueries from './graphql.js';

// Custom JSON parser.
superagent.parse = {
  'application/json': (res) => {
    try {
      return JSON.parse(res);
    } catch(err) {
      return {};
    }
  }
};

// Default args.
const defaults = {
  'github': {
    'host': 'api.github.com',
    'protocol': 'https'
  }
};

// Public api.
export default {

  // Get a repo.
  repo: (user, { owner, name }, cb) => {
    let token = (user && user.credential != null) ? user.credential.accessToken : null;
    let data = _.defaults({
      'path': `/repos/${owner}/${name}`,
      'headers': headers(token)
    }, defaults.github);

    request(data, cb);
  },

  // Get repos user has access to or are public to owner.
  repos: (user, ...args) => {
    if (args.length = 2) {
      var [ owner, cb ] = args;
    } else { // assumes 1
      var [ cb ]  = args;
    }

    let token = (user && user.credential != null) ? user.credential.accessToken : null;
    let data = _.defaults({
      'path': owner ? `/users/${owner}/repos` : '/user/repos',
      'headers': headers(token)
    }, defaults.github);

    request(data, cb);
  },

  allProjects: (user, { owner, name }, cb) => {
    let token = (user && user.credential != null) ? user.credential.accessToken : null;

    let data = _.defaults({
      path: '/graphql',
      body: JSON.stringify(name ? {
        query: graphqlQueries.allProjectsForRepo,
        variables: {
          owner,
          name
        }
      } : {
        query: graphqlQueries.allProjectsForOrg,
        variables: {
          login: owner
        }
      }),
      headers: {
        'Authorization': `bearer ${token}`,
      },
      method: 'POST',
    }, defaults.github);

    request(data, (err, res) => {
      cb(err, opa.get(res, 'data.repository.projects.nodes'));
    });
  },

  oneProject: (user, { owner, name, project_number }, cb) => {
    let token = (user && user.credential != null) ? user.credential.accessToken : null;

    let data = _.defaults({
      path: '/graphql',
      body: JSON.stringify(name ? {
        query: graphqlQueries.oneProject,
        variables: {
          owner,
          name,
          project_number
        }
      } : {
        query: graphqlQueries.oneOrgProject,
        variables: {
          owner,
          project_number
        }
      }),
      headers: {
        'Authorization': `bearer ${token}`,
      },
      method: 'POST',
    }, defaults.github);

    request(data, (err, res) => {
      cb(err, opa.get(res, 'data.repository.project'));
    });
  }
};

// Make a request using SuperAgent.
let request = ({ protocol, host, method, path, query, headers, body }, cb) => {
  let exited = false;

  // Make the query params.
  let q = '';
  if (query) {
    q = '?' + _.map(query, (v, k) => { return `${k}=${v}`; }).join('&');
  }

  // The URI.
  const url = `${protocol}://${host}${path}${q}`;
  let req = method === 'POST' ? superagent.post(url) : superagent.get(url);
  // Add headers.
  _.each(headers, (v, k) => { req.set(k, v); });

  // Timeout for requests that do not finish... see #32.
  let ms = config.request.timeout;
  ms = (_.isString(ms)) ? parseInt(ms, 10) : ms;
  let timeout = setTimeout(() => {
    exited = true;
    cb('Request has timed out');
  }, ms);

  if (body) {
    req.send(body);
  }

  // Send.
  req.end((err, data) => {
    // Arrived too late.
    if (exited) return;
    // All fine.
    exited = true;
    clearTimeout(timeout);
    // Actually process the response.
    response(err, data, cb);
  });
};

// How do we respond to a response?
let response = (err, data, cb) => {
  if (err) return cb(error(data ? data.body : err));
  // 2xx?
  if (data.statusType !== 2) return cb(error(data.body));
  // All good.
  cb(null, data.body);
};

// Give us headers.
let headers = (token) => {
  // The defaults.
  let h = {
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github.v3'
  };
  // Add token?
  if (token) {
    h.Authorization = `token ${token}`;
  }

  return h;
};

// Parse an error.
let error = (err) => {
  let text, type;

  switch (false) {
    case !_.isString(err):
      text = err;
      break;

    case !_.isArray(err):
      text = err[1];
      break;

    case !(_.isObject(err) && _.isString(err.message)):
      text = err.message;
  }

  if (!text) {
    try {
      text = JSON.stringify(err);
    } catch (_err) {
      text = err.toString();
    }
  }

  return text;
};
