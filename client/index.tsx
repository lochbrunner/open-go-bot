import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { configureStore } from './store';

import ScenarioContainer from './scenarios';
import { Home } from './containers/home';

const store = configureStore();
const history = createBrowserHistory();

ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/scenario/:scenario" component={ScenarioContainer} />
        <Redirect to="/" />
        {/* ANT */}
      </Switch>
    </Router>
  </Provider>,
  document.getElementById('root')
);