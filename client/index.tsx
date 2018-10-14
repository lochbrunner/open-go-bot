import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route, Switch } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { configureStore } from './store';
import * as Go from './scenarios/go';

const store = configureStore();
const history = createBrowserHistory();

ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <Switch>
        <Route exact path="/go" component={Go.App} />
        <Route exact path="/" component={Go.App} />
        {/* MNIST */}
        {/* ANT */}
      </Switch>
    </Router>
  </Provider>,
  document.getElementById('root')
);