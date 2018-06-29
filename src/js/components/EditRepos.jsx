import React from 'react';
import _ from 'lodash';
import cls from 'classnames';

import actions from '../actions/appActions.js';

import Icon from './Icon.jsx';
import Link from './Link.jsx';

export default class EditRepos extends React.Component {

  displayName: 'EditRepos.jsx'

  constructor(props) {
    super(props);
  }

  _onDelete(repo) {
    actions.emit('repos.delete', repo);
  }

  render() {
    const { repos } = this.props;

    let list = _(repos.list)
    .sortBy(({ owner, name }) => `${owner}/${name}`)
    .map(({owner, name}, i) => {
      return (
        <tr key={`${owner}-${name}`}>
          <td colSpan="2">
            <Link
              route={{ 'to': 'projects', 'params': { owner, name } }}
              className="repo"
              >
              {owner}/{name}
            </Link>
          </td>
          <td
            className="action"
            onClick={this._onDelete.bind(this, { owner, name })}
          ><Icon name="delete" /> Delete</td>
        </tr>
      );
    }).value();

    // Wait for something to show.
    if (!list.length) return false;

    return (
      <div id="repos">
        <div className="header"><h2>Edit Repos</h2></div>
        <table>
          <tbody>{list}</tbody>
        </table>
        <div className="footer">
          <a onClick={this.props.onToggleMode}>View Repos</a>
        </div>
      </div>
    );
  }

}