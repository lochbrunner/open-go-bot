import {Action} from 'redux-actions';

import {GraphPayload, NodePatch, SetGraphPayload, UpdateGraph, UpdateGraphNodeProperty} from '../actions/graph';
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
          container.connections.inputs.get(k).valid = {
            state: 'invalid',
            reason: 'Connection missing'
          };
          if (container.node['inputs'] !== undefined) {
            const op = container.node as Model.OperationNode;
            // TODO(#2): Is this not part of nodePatch?
            op.inputs[k] = undefined;
          }
        }
      }
      if (connectionsPatch.removeOutputs !== undefined) {
        for (const k of connectionsPatch.removeOutputs) {
          container.connections.outputs.get(k).valid = {
            state: 'invalid',
            reason: 'Connection missing'
          };
          container.node.outputs = [];
          // TODO(#2): Is this not part of nodePatch?
          container.node.outputs[0] = undefined;
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

const patchNode = (container: Model.NodeContainer, nodePatch: NodePatch) => {
  if (nodePatch.removeInputs !== undefined) {
    // TODO(#2): Not implemented yet
  }
  if (nodePatch.removeOutputs !== undefined) {
    // TODO(#2): Not implemented yet
  }
  if (nodePatch.addInputs !== undefined) {
    const node = container.node as Model.OperationNode;
    for (const [key, value] of nodePatch.addInputs) {
      node.inputs[key] = value;
    }
  }
  if (nodePatch.addOutputs !== undefined) {
    for (const [key, value] of nodePatch.addOutputs) {
      container.node.outputs[0] = value;
    }
  }
  return container;
};

const hasInvalidConnection =
    (connections: Map<string, Model.ConnectionConstraints>): boolean => {
      for (const [_, o] of connections.entries()) {
        if (o.valid.state === 'invalid') return true;
      }
      return false;
    };

export const reducers: (
    state: RootState,
    action:
        ActionTypes) => RootState = (state: RootState, action: ActionTypes) => {
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
    const payload = action.payload as UpdateGraph;
    const dict = new Map<string, Model.NodeContainer>();
    const {graph} = state;
    for (let c of state.graph.nodes) dict.set(c.node.id, c);
    for (const graphConnection of payload.graphConnections) {
      const container = dict.get(graphConnection.nodeId);
      patchConnections(container, graphConnection.connectionsPatch);
      patchNode(container, graphConnection.nodePatch);
      // TODO: Check for invalid config
      // Check if any connection is invalid
      if (hasInvalidConnection(container.connections.inputs) ||
          hasInvalidConnection(container.connections.outputs))
        container.valid = false;
      else
        container.valid = true;
    }
    if (payload.removeNodes) {
      // Find indices of the nodes
      const idMapArray = state.graph.nodes.map(
                             (v, i) => ([v.node.id, i])) as [string, number][];
      const idMap = new Map<string, number>(idMapArray);
      // Sort in descending order
      const indicesToDelete =
          payload.removeNodes.map(id => idMap.get(id)).sort((a, b) => b - a);
      for (const indexToDelete of indicesToDelete) {
        graph.nodes.splice(indexToDelete, 1);
      }
    }
    return {...state, graph: {...state.graph}};
  } else if (action.type === Constants.GRAPH_CREATE_NODE) {
    const payload = action.payload as Model.NodeContainer;
    return {
      ...state,
      graph: {...state.graph, nodes: [...state.graph.nodes, payload]}
    };
  }
  return state;
};