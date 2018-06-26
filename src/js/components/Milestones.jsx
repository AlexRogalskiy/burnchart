import React from 'react';
import _ from 'lodash';
import cls from 'classnames';

import format from '../modules/format.js';

import actions from '../actions/appActions.js';

import Icon from './Icon.jsx';
import Link from './Link.jsx';

export default class Milestones extends React.Component {

  displayName: 'Milestones.jsx'

  constructor(props) {
    super(props);
  }

  // Cycle through milestones sort order.
  _onSort() {
    actions.emit('repos.sort');
  }

  _onRefresh() {
    actions.emit('repos.load');
  }

  render() {
    const { repos, repo } = this.props;

    // Show the repos with errors first.
    const errors = _(repos.list).filter('errors').map((repo, i) => {
      const text = repo.errors.join('\n');
      return (
        <tr key={`err-${i}`}>
          <td colSpan="3" className="repo">
            <div className="project">{repo.owner}/{repo.name}
              <span className="error" title={text}><Icon name="warning"/></span>
            </div>
          </td>
        </tr>
      );
    }).value();

    // Now for the list of milestones, index sorted.
    const list = [];
    _.each(repos.index, ([ pI, mI ]) => {
      const { owner, name, milestones } = repos.list[pI];
      const milestone = milestones[mI];

      // Filter down?
      if (!(!repo || (repo.owner == owner && repo.name == name))) return;

      list.push(
        <tr className={cls({ 'done': milestone.stats.isDone })} key={`${pI}-${mI}`}>
          <td className="repo">
            <Link
              route={{ 'to': 'milestones', 'params': { owner, name } }}
              className="project"
            >
              {owner}/{name}
            </Link>
          </td>
          <td>
            <Link
              route={{ 'to': 'chart', 'params': { owner, name, 'milestone': milestone.number } }}
              className="milestone"
            >
              {milestone.title}
            </Link>
          </td>
          <td style={{ 'width': '1%' }}>
            <div className="progress">
              <span className="percent">{Math.floor(milestone.stats.progress.points)}%</span>
              <span className={cls('due', { 'red': milestone.stats.isOverdue })}>
                {format.due(milestone.due_on)}
              </span>
              <div className="outer bar">
                <div
                  className={cls('inner', 'bar', { 'green': milestone.stats.isOnTime, 'red': !milestone.stats.isOnTime })}
                  style={{ 'width': `${milestone.stats.progress.points}%` }}
                />
              </div>
            </div>
          </td>
        </tr>
      );
    });

    // Wait for something to show.
    if (!errors.length && !list.length) return false;

    if (repo) {
      // Repo-specific milestones.
      return (
        <div id="projects">
          <div className="header">
            <a className="sort" onClick={this._onSort}><Icon name="sort"/> Sorted by {repos.sortBy}</a>
            <h2>Milestones</h2>
          </div>
          <table>
            <tbody>{list}</tbody>
          </table>
          <div className="footer" />
        </div>
      );
    } else {
      // List of repos and their milestones.
      return (
        <div id="projects">
          <div className="header">
            <a className="sort" onClick={this._onSort}><Icon name="sort"/> Sorted by {repos.sortBy}</a>
            <h2>Repos</h2>
          </div>
          <table>
            <tbody>
              {errors}
              {list}
            </tbody>
          </table>
          <div className="footer">
            <a onClick={this.props.onToggleMode}>Edit Repos</a>
            <a onClick={this._onRefresh}>Refresh Repos</a>
          </div>
        </div>
      );
    }
  }

}
