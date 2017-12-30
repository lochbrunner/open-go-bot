import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route, Switch } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { configureStore } from './store';
import * as Game from './containers/game';
import * as Training from './containers/training';

const store = configureStore();
const history = createBrowserHistory();

ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <Switch>
        <Route exact path="/" component={Game.App} />
        <Route path="/training" component={Training.App} />
      </Switch>
    </Router>
  </Provider>,
  document.getElementById('root')
);