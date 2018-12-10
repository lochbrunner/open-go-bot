import {Action} from 'redux-actions';

import {GraphPayload, parseShape, SetGraphPayload, UpdateGraphNode} from '../actions/graph';
import {Graph} from '../components/graph';
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
        const nodeDict = new Map<string, Model.Node>();
        for (let c of state.graph.nodes) nodeDict.set(c.node.id, c.node);
        const payload = action.payload as UpdateGraphNode;
        const node = nodeDict.get(payload.nodeId);
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
        } else if (payload.propertyName === 'shape') {
          const shape = parseShape(payload.newValue as string);
          node[payload.propertyName] = shape;
        } else {
          node[payload.propertyName] = payload.newValue;
        }
        console.log(payload);
        return {...state};
      }
      return state;
    };