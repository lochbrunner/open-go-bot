import {applyMiddleware, compose, createStore, Store} from 'redux';
import thunk from 'redux-thunk';

import rootReducer from '../reducers';

export function configureStore(initialState?: RootState): Store<RootState> {
  const store = createStore(
      rootReducer, initialState,
      compose(
          applyMiddleware(thunk) as any,
          window.devToolsExtension && window.devToolsExtension()));

  if (module.hot) {
    module.hot.accept('../reducers', () => {
      store.replaceReducer(rootReducer);
    });
  }

  return store;
}
