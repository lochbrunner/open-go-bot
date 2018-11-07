import {Action} from 'redux-actions';

import {GraphPayload} from '../actions/graph';
import {GRAPH_SET} from '../constants/actions';

// See
// https://stackoverflow.com/questions/40463060/turn-a-string-literal-type-to-a-literal-value

type ActionTypes = Action<GraphPayload>;

export const reducers: (state: RootState, action: ActionTypes) => RootState =
    (state: RootState, action: ActionTypes) => {
      if (action.type === GRAPH_SET) {
        return {...state, graph: action.payload.newGraph};
      }
      return state;
    };