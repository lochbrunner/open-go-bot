import {applyMiddleware, compose, createStore, Store} from 'redux';
import thunk from 'redux-thunk';

import rootReducer from '../reducers';

export function configureStore(initialState?: RootState): Store<RootState> {
  const create = window.devToolsExtension ?
      window.devToolsExtension()(createStore) :
      createStore;

  const store = createStore(
      rootReducer, initialState,
      compose(
          applyMiddleware(thunk) as any,
          window.devToolsExtension && window.devToolsExtension()));

  if (module.hot) {
    module.hot.accept('../reducers', () => {
      // const nextReducer = require('../reducers');
      store.replaceReducer(rootReducer);
    });
  }

  return store;
}
