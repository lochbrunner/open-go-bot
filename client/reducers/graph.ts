import {Action} from 'redux-actions';

import {GraphPayload, SetGraphPayload, UpdateGraphNode} from '../actions/graph';
import {Graph} from '../components/graph';
import * as Constants from '../constants/actions';

// See
// https://stackoverflow.com/questions/40463060/turn-a-string-literal-type-to-a-literal-value

type ActionTypes = Action<GraphPayload>;

const validate = (prevGraph: Graph, action: UpdateGraphNode): boolean => {
  return true;
};

const calculateShape =
    (node: Model.Node, propertyName: string,
     value: string | number): number[] => {
      if (node.type === 'convolution') {
        console.warn(
            `Calculating shape of node type ${node.type} not implemented yet!`);
      } else {
        console.warn(
            `Calculating shape of node type ${node.type} not implemented yet!`);
      }
      return [];
    };

export const reducers: (state: RootState, action: ActionTypes) => RootState =
    (state: RootState, action: ActionTypes) => {
      if (action.type === Constants.GRAPH_SET) {
        const payload = action.payload as SetGraphPayload;
        return {...state, graph: payload.newGraph};
      } else if (action.type === Constants.GRAPH_UPDATE_NODE) {
        const nodeDict = new Map<string, Model.Node>();
        for (let c of state.graph.nodes) nodeDict.set(c.node.id, c.node);
        const payload = action.payload as UpdateGraphNode;
        const shape = calculateShape(
            nodeDict.get(payload.nodeId), payload.propertyName,
            payload.newValue);

        console.log(payload);
        console.log(`New shape: ${shape.join(' x ')}`);
      }
      return state;
    };