import React from 'react';
import Autosuggest from 'react-autosuggest';

import App from '../App.jsx';

import actions from '../actions/appActions.js';

import Icon from './Icon.jsx';
import S from './Space.jsx';

export default class AddRepoForm extends React.Component {

  displayName: 'AddRepoForm.jsx'

  constructor(props) {
    super(props);
    // Blank input.
    this.state = { 'val': '' };
    // Bindings.
    this._onChange = this._onChange.bind(this);
    this._onAdd = this._onAdd.bind(this);
  }

  // Sign user in.
  _onSignIn() {
    actions.emit('user.signin');
  }

  _onChange(evt, { newValue }) {
    this.setState({ 'val': newValue });
  }

  // Get a list of repo suggestions.
  _onGetList({ value }) {
    actions.emit('repos.search', value);
  }

  // What should be the value of the suggestion.
  _getListValue(value) {
    return value;
  }

  // How do we render the repo?
  _renderListValue(value) {
    return value;
  }

  // Add the project.
  _onAdd() {
    const val = this.state.val;
    // Validate input.
    if (!/^[^\s\/]+\/[^\s\/]+$/.test(val)) return;

    const [ owner, name ] = val.split('/');
    actions.emit('repos.add', { owner, name });
    // Redirect to the dashboard.
    App.navigate({ 'to': 'repos' });
  }

  render() {
    let user;

    if (!(this.props.user != null && 'uid' in this.props.user)) {
      user = (
        <span><S />If you'd like to add a private GitHub repo,
        <S /><a onClick={this._onSignIn}>Sign In</a> first.</span>
      );
    }

    return (
      <div id="add">
        <div className="header">
          <h2>Add a Repo</h2>
          <p>Type the name of a GitHub repository that has some
          projects with issues.{user}</p>
        </div>

        <div className="form">
          <table>
            <tbody>
              <tr>
                <td>
                  <Autosuggest
                    suggestions={this.props.suggestions || []}
                    getSuggestionValue={this._getListValue}
                    onSuggestionsUpdateRequested={this._onGetList}
                    renderSuggestion={this._renderListValue}
                    theme={{
                      'container': 'suggest',
                      'suggestionsContainer': 'list',
                      'suggestion': 'item',
                      'suggestionFocused': 'item focused'
                    }}
                    inputProps={{
                      'placeholder': 'user/repo',
                      'value': this.state.val,
                      'onChange': this._onChange
                    }}
                  />
                </td>
                <td><a onClick={this._onAdd}>Add</a></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="protip">
          <Icon name="rocket"/> Protip: To see if a project is on track or not,
          make sure it has a due date assigned to it.
        </div>
      </div>
    );
  }

}
