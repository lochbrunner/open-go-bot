import {Action} from 'redux-actions';

import {GraphPayload, parseShape, SetGraphPayload, UpdateGraphNodeConnections, UpdateGraphNodeProperty} from '../actions/graph';
import * as Constants from '../constants/actions';

// See
// https://stackoverflow.com/questions/40463060/turn-a-string-literal-type-to-a-literal-value

type ActionTypes = Action<GraphPayload>;

const patchConnections =
    // TODO: Make this immutable
    (container: Model.NodeContainer,
     connectionsPatch: Model.ConnectionsInfo) => {
      if (connectionsPatch.removeInputs !== undefined) {
        for (const k of connectionsPatch.removeInputs) {
          container.connections.inputs.delete(k);
          if (container.node['inputs'] !== undefined) {
            const op = container.node as Model.OperationNode;
            // delete op.inputs[k];
            op.inputs[k] = undefined;
          }
        }
      }
      if (connectionsPatch.removeOutputs !== undefined) {
        for (const k of connectionsPatch.removeOutputs) {
          container.connections.outputs.delete(k);
          container.node.outputs = [];
          container.node.outputs[0] = undefined;
          // delete container.node.outputs[k];
        }
      }

      const {inputs, outputs} = connectionsPatch;
      container.connections.inputs =
          new Map<string, Model.ConnectionConstraints>(
              [...container.connections.inputs, ...inputs]);
      container.connections.outputs =
          new Map<string, Model.ConnectionConstraints>(
              [...container.connections.outputs, ...outputs]);
      return container;
    };

export const reducers: (state: RootState, action: ActionTypes) => RootState =
    (state: RootState, action: ActionTypes) => {
      if (action.type === Constants.GRAPH_SET) {
        const payload = action.payload as SetGraphPayload;
        return {...state, graph: payload.newGraph};
      } else if (action.type === Constants.GRAPH_UPDATE_NODE) {
        const dict = new Map<string, Model.NodeContainer>();
        for (let c of state.graph.nodes) dict.set(c.node.id, c);
        const payload = action.payload as UpdateGraphNodeProperty;
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
          patchConnections(container, payload.connectionsPatch);
        }
        container.valid = payload.valid;
        state.graph.isValid = payload.valid;
        return {...state};
      } else if (action.type === Constants.GRAPH_UPDATE_NODES) {
        const payload = action.payload as UpdateGraphNodeConnections[];
        console.log(payload);
        const dict = new Map<string, Model.NodeContainer>();
        const {graph} = state;
        for (let c of state.graph.nodes) dict.set(c.node.id, c);
        for (const graphConnection of payload) {
          const container = dict.get(graphConnection.nodeId);
          container.valid = graphConnection.valid;
          patchConnections(container, graphConnection.connectionsPatch);
        }
        return {...state, graph: {...state.graph}};
      }
      return state;
    };