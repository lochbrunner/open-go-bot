import {Action} from 'redux-actions';

import {GraphPayload, parseShape, SetGraphPayload, UpdateGraphNode} from '../actions/graph';
import * as Constants from '../constants/actions';

// See
// https://stackoverflow.com/questions/40463060/turn-a-string-literal-type-to-a-literal-value

type ActionTypes = Action<GraphPayload>;

export const reducers: (state: RootState, action: ActionTypes) => RootState =
    (state: RootState, action: ActionTypes) => {
      if (action.type === Constants.GRAPH_SET) {
        const payload = action.payload as SetGraphPayload;
        return {...state, graph: payload.newGraph};
      } else if (action.type === Constants.GRAPH_UPDATE_NODE) {
        const dict = new Map<string, Model.NodeContainer>();
        for (let c of state.graph.nodes) dict.set(c.node.id, c);
        const payload = action.payload as UpdateGraphNode;
        const container = dict.get(payload.nodeId);
        const {node} = container;
        if (payload.propertyName === 'init') {
          const v = node as Model.Variable;
          if (v.init === 'uniform') {
            delete v.max;
            delete v.min;
          } else if (v.init === 'normal') {
            delete v.mean;
            delete v.stdDev;
          }
          if (payload.newValue === 'uniform') {
            v['max'] = 1;
            v['min'] = 0;
          } else if (v.init === 'normal') {
            v['mean'] = 0;
            v['stdDev'] = 0.1;
          }
        } else {
          node[payload.propertyName] = payload.newValue;
        }
        if (payload.connectionsPatch !== undefined) {
          // Update connections
          const {inputs, outputs} = payload.connectionsPatch;
          container.connections.inputs =
              new Map<string, Model.ConnectionConstraints>(
                  [...container.connections.inputs, ...inputs]);
          container.connections.outputs =
              new Map<string, Model.ConnectionConstraints>(
                  [...container.connections.outputs, ...outputs]);
        }
        state.graph.isValid = payload.valid;
        return {...state};
      }
      return state;
    };