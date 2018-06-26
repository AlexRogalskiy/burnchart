import { assert } from 'chai';
import path from 'path';
import opa from 'object-path';
import { noCallThru } from 'proxyquire'
let proxy = noCallThru();

import config from '../src/config.js';

class Sa {
  constructor() {
    // How soon do we call back?
    this.timeout = 1;
  }

  // Save the uri.
  get(uri) {
    this.params = { uri };
    return this;
  }

  // Save the key-value pair.
  set(key, value) {
    this.params[key] = value;
    return this;
  }

  // Call back with the response, async.
  end(cb) {
    setTimeout(() => cb(null, this.response), this.timeout);
  }
}

let superagent = new Sa();

// Proxy the superagent lib.
const lib = path.resolve(__dirname, '../src/js/modules/github/request.js');
const request = proxy(lib, { superagent }).default;

describe('request', () => {
  it('all milestones (ok)', done => {
    superagent.response = {
      'statusType': 2,
      'error': false,
      'body': [ null ]
    };

    const owner = 'radekstepan';
    const name = 'burnchart';

    request.allMilestones({}, { owner, name }, (err, data) => {
      assert.isNull(err);
      assert.deepEqual(superagent.params, {
        'uri': 'https://api.github.com/repos/radekstepan/burnchart/milestones?state=open&sort=due_date&direction=asc',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3'
      });
      assert.deepEqual(data, [null]);
      done();
    });
  });

  it('all milestones (403)', done => {
    superagent.response = {
      'statusType': 4,
      'error': false,
      'body': {
        'message': 'API rate limit exceeded'
      }
    };

    const owner = 'radekstepan';
    const name = 'burnchart';
    const milestone = 0;

    request.oneMilestone({}, { owner, name, milestone }, err => {
      assert(err, 'Error');
      done();
    });
  });

  it('one milestone (ok)', done => {
    superagent.response = {
      'statusType': 2,
      'error': false,
      'body': [ null ]
    };

    const owner = 'radekstepan';
    const name = 'burnchart';
    const milestone = 1;

    request.oneMilestone({}, { owner, name, milestone }, (err, data) => {
      assert.isNull(err);
      assert.deepEqual(superagent.params, {
        'uri': 'https://api.github.com/repos/radekstepan/burnchart/milestones/1?state=open&sort=due_date&direction=asc',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3'
      });
      assert.deepEqual(data, [null]);
      done();
    });
  });

  it('one milestone (404)', done => {
    superagent.response = {
      'statusType': 4,
      'error': Error("cannot GET undefined (404)"),
      'body': {
        'documentation_url': "http://developer.github.com/v3",
        'message': "Not Found"
      }
    };

    const owner = 'radekstepan';
    const name = 'burnchart';
    const milestone = 0;

    request.oneMilestone({}, { owner, name, milestone }, err => {
      assert(err, 'Not Found');
      done();
    });
  });

  it('one milestone (500)', done => {
    superagent.response = {
      'statusType': 5,
      'error': Error("Error"),
      'body': null
    };

    const owner = 'radekstepan';
    const name = 'burnchart';
    const milestone = 0;

    request.oneMilestone({}, { owner, name, milestone }, err => {
      assert(err, 'Error');
      done();
    });
  });

  it('all issues (ok)', done => {
    superagent.response = {
      'statusType': 2,
      'error': false,
      'body': [ null ]
    };

    const owner = 'radekstepan';
    const name = 'burnchart';
    const milestone = 0;

    request.allIssues({}, { owner, name, milestone }, {}, (err, data) => {
      assert.isNull(err);
      assert.deepEqual(superagent.params, {
        'uri': 'https://api.github.com/repos/radekstepan/burnchart/issues?milestone=0&per_page=100',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3'
      });
      assert.deepEqual(data, [ null ]);
      done();
    });
  });

  it('timeout', done => {
    opa.set(config, 'request.timeout', 10);

    superagent.timeout = 20;
    superagent.response = {
      'statusType': 2,
      'error': false,
      'body': [ null ]
    };

    const owner = 'radekstepan';
    const name = 'burnchart';
    const milestone = 0;

    request.allIssues({}, { owner, name, milestone }, {}, (err) => {
      assert(err, 'Request has timed out');
      done();
    });
  });

  it('use tokens', done => {
    superagent.response = {};

    const user = { 'credential': { 'accessToken': 'ABC' }};
    const owner = 'radekstepan';
    const name = 'burnchart';

    request.repo(user, { owner, name }, () => {
      assert(superagent.params.Authorization, 'token ABC');
      done();
    });
  });
});
