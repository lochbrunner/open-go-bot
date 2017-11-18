import { createStore, applyMiddleware, Store } from 'redux';
// import { logger } from '../middleware';
import rootReducer from '../reducers';

export function configureStore(initialState?: RootState): Store<RootState> {
    const create = window.devToolsExtension
        ? window.devToolsExtension()(createStore)
        : createStore;

//   const createStoreWithMiddleware = applyMiddleware(logger)(create);
 
    const store = createStore(rootReducer, initialState, window.devToolsExtension && window.devToolsExtension());
//   const store = createStoreWithMiddleware(rootReducer, initialState) as Store<RootState>;

    if (module.hot) {
        module.hot.accept('../reducers', () => {
            const nextReducer = require('../reducers');
            store.replaceReducer(nextReducer);
        });
    }

    return store;
}
