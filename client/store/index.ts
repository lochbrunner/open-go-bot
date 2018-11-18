import {applyMiddleware, compose, createStore, Store} from 'redux';
import thunk from 'redux-thunk';

import rootReducer from '../reducers';

export function configureStore(initialState?: RootState): Store<RootState> {
  if (window.devToolsExtension !== undefined) {
    const store = createStore(
        rootReducer, initialState,
        compose(
            applyMiddleware(thunk),
            window.devToolsExtension && window.devToolsExtension()));

    if (module.hot) {
      module.hot.accept('../reducers', () => {
        store.replaceReducer(rootReducer);
      });
    }

    return store;
  } else {
    const store =
        createStore(rootReducer, initialState, applyMiddleware(thunk));
    if (module.hot) {
      module.hot.accept('../reducers', () => {
        store.replaceReducer(rootReducer);
      });
    }
    return store;
  }
}
