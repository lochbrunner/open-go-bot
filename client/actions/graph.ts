import * as _ from 'lodash';
import {ChangeAction, Endpoint} from 'react-flow-editor';
import {createAction} from 'redux-actions';

import * as Actions from '../constants/actions';
import {createDictFromContainers, createDictFromGraph} from '../utilities/toolbox';

import {ChunkActionType1, ChunkActionType2} from './common';

export interface SetGraphPayload { newGraph: Model.Graph; }

export type UpdateGraphNode =
    UpdateGraphNodeProperty|UpdateGraphNodeConnections;

export interface UpdateGraphNodeBase {
  nodeId: string;
  connectionsPatch?: Model.ConnectionsInfo;
  valid: boolean;
}

export interface NodePatch {
  removeInputs?: string[];
  removeOutputs?: number[];
  addInputs?: Map<string, string>;
  addOutputs?: Map<string, string>;
}

export interface UpdateGraphNodeConnections extends UpdateGraphNodeBase {
  connectionsPatch: Model.ConnectionsInfo;
  nodePatch: NodePatch;
}

export interface UpdateGraph {
  graphConnections: UpdateGraphNodeConnections[];
  removeNodes?: string[];
}

export interface UpdateGraphNodeProperty extends UpdateGraphNodeBase {
  nodeType: Model.Node['type'];
  propertyName: string;
  newValue: number|string|number[];
}

export interface TryUpdateGraphNode {
  nodeId: string;
  nodeType: Model.Node['type'];
  propertyName: string;
  newValue: string|number;
}

export type GraphPayload = SetGraphPayload|UpdateGraphNodeProperty|UpdateGraph;

export const setGraph = createAction<SetGraphPayload>(Actions.GRAPH_SET);

export const updateGraphNode =
    createAction<UpdateGraphNodeProperty>(Actions.GRAPH_UPDATE_NODE);

export const parseShape = (shapeString: string): number[] | undefined => {
  try {
    return shapeString.split('x').map(c => parseInt(c));
  } catch (e) {
    return undefined;
  }
};

const englishEnumerate = (i: number) => {
  if (i === 1) return 'first';
  if (i === 2) return 'second';
  return `${i}th`;
};

const validateShape =
    (constraint: (number|undefined)[], shape: number[]): string => {
      if (constraint.length === 0) return 'valid';
      if (constraint.length !== shape.length) return 'Wrong rank';
      for (let i = 0; i < constraint.length; ++i) {
        if (constraint[i] === undefined) continue;
        if (constraint[i] !== shape[i])
          return `${
                    englishEnumerate(i + 1)
                  } index does not match (${shape[i]} ≠ ${constraint[i]})`;
      }
      return 'valid';
    };

const validateShapeConstraints =
    (a: (number|undefined)[], b: (number|undefined)[]): string => {
      if (a.length === 0 || b.length === 0) return 'valid';
      if (a.length !== b.length) return 'Wrong rank';
      for (let i = 0; i < a.length; ++i) {
        if (a[i] === undefined) continue;
        if (b[i] === undefined) continue;
        if (a[i] !== b[i])
          return `${
                    englishEnumerate(i + 1)
                  } index does not match (${a[i]} ≠ ${b[i]})`;
      }
      return 'valid';
    };

// TODO: Make this function pure(do not change the input)
const validateMaxPooling = (dict: Map<string, Model.NodeContainer>,
                            container: Model.NodeContainer,
                            node: Model.MaxPool): 'valid' |
    'invalid' | 'postpone' => {
  let valid: 'valid'|'invalid' = 'valid';

  const orig = dict.get(node.inputs.orig);
  if (orig.connections === undefined || orig.connections.outputs.size < 1) {
    return 'postpone';
  }

  // TODO(Matthias): Validate input shape

  const {strides} = node;
  const origShape = orig.connections.outputs.get('output').shape;
  let shape: number[];

  if (typeof node.filterSize === 'number') {
    shape = [
      Math.floor(origShape[0] / strides) - node.pad * 2, origShape[1],
      origShape[2]
    ];

  } else {
    shape = [
      Math.floor(origShape[0] / strides) - node.pad * 2,
      Math.floor(origShape[1] / strides) - node.pad * 2, origShape[2]
    ];
  }
  container.connections.outputs.set('output', {shape, valid: {state: 'valid'}});
  // TODO(Matthias): Validate Max Pooling
  container.connections.inputs.set(
      'orig', {shape: [undefined], valid: {state: 'valid'}});

  return valid;
};

const validateRelu =
    (dict: Map<string, Model.NodeContainer>, container: Model.NodeContainer,
     node: Model.Relu): 'valid' |
    'invalid' | 'postpone' => {
      let valid: 'valid'|'invalid' = 'valid';

      const orig = dict.get(node.inputs.orig);
      if (orig.connections === undefined || orig.connections.outputs.size < 1) {
        // Do it later
        console.warn(`Skipped re-evaluating ${node.name} of type ${node.type}`);
        return 'postpone';
      }
      container.connections.inputs.set(
          'orig', {shape: [], valid: {state: 'valid'}});
      container.connections.outputs.set('output', {
        shape: [...orig.connections.outputs.get('output').shape],
        valid: {state: 'valid'}
      });
      return valid;
    };

const validateResharp =
    (dict: Map<string, Model.NodeContainer>, container: Model.NodeContainer,
     node: Model.Reshape): 'valid' |
    'invalid' | 'postpone' => {
      let valid: 'valid'|'invalid' = 'valid';

      // Is the input dividable by the new shape?
      const orig = dict.get(node.inputs.orig);
      const origShape = orig.connections.outputs.get('output').shape;
      const inputDimension = origShape.reduce((p, r) => r * p, 1);
      const outputDimension = node.shape.reduce((p, r) => r * p, 1);
      container.connections.outputs.set(
          'output', {shape: node.shape, valid: {state: 'valid'}});
      if (inputDimension % outputDimension === 0) {
        container.connections.inputs.set(
            'orig', {shape: [], valid: {state: 'valid'}});
      } else {
        valid = 'invalid';
        container.connections.inputs.set(
            'output',
            {shape: [], valid: {state: 'invalid', reason: 'Not validated'}});
      }

      return valid;
    };

const validateConvolution = (dict: Map<string, Model.NodeContainer>,
                             container: Model.NodeContainer,
                             node: Model.Convolution): 'valid' |
    'invalid' | 'postpone' => {
  // If the shape of one input is not there enqueue it.
  const orig = dict.get(node.inputs.orig);
  const kernel = dict.get(node.inputs.kernel);
  if (orig.connections === undefined || orig.connections.outputs.size < 1 ||
      kernel.connections === undefined || kernel.connections.outputs.size < 1) {
    // Do it later
    console.warn(`Skipped re-evaluating ${node.name} of type ${node.type}`);
    return 'postpone';
  }
  let valid: 'valid'|'invalid' = 'valid';
  const {strides} = node;
  const origShape = orig.connections.outputs.get('output').shape;
  const kernelShape = kernel.connections.outputs.get('output').shape;
  if (node.rank === 2) {
    if (node.padding === 'same') {
      // Ignore own filter settings
      const shape = [
        Math.floor(origShape[0] / strides), Math.floor(origShape[1] / strides),
        kernelShape[3]
      ];
      container.connections.outputs.set(
          'output', {shape, valid: {state: 'valid'}});

      // Validate orig and kernel shape
      container.connections.inputs.set(
          'orig', {shape: [], valid: {state: 'valid'}});
      container.connections.inputs.set(
          'kernel', {shape: [], valid: {state: 'valid'}});
      // Any of have wrong rank ?
      if (kernelShape.length !== 4 || origShape.length !== 3) {
        if (kernelShape.length !== 4) {
          valid = 'invalid';
          container.connections.inputs.get('kernel').valid = {
            state: 'invalid',
            reason: 'Kernel must be of rank 4'
          };
        } else {  // => if (origShape.length !== 3)
          valid = 'invalid';
          container.connections.inputs.get('orig').valid = {
            state: 'invalid',
            reason: 'Input must be of rank 3'
          };
        }
      }
      // Do they fit together?
      else {
        container.connections.inputs.get('orig').shape = [];
        if (kernelShape[3] !== node.filters) {
          container.connections.inputs.get('kernel').valid = {
            state: 'invalid',
            reason: `Last dimension must be ${
                                              node.filters
                                            } and not ${kernelShape[3]}`
          };
          valid = 'invalid';
        } else if (origShape[2] !== kernelShape[2]) {
          container.connections.inputs.get('kernel').valid = {
            state: 'invalid',
            reason: `Third dimension must be ${origShape[2]}`
          };
          container.connections.inputs.get('orig').valid = {
            state: 'invalid',
            reason: `Third dimension must be ${kernelShape[2]}`
          };
          valid = 'invalid';
        } else {
          // Everything is fine
          container.connections.inputs.get('orig').shape =
              [undefined, undefined, kernelShape[2]];
          container.connections.inputs.get('kernel').shape =
              [undefined, undefined, kernelShape[2], node.filters];
        }
      }

    } else {
      valid = 'invalid';
      console.error(
          `Convolution with padding ${node.padding} not supported yet!`);
    }
  } else {
    valid = 'invalid';
    console.error(`Convolution of rank ${node.rank} not supported yet!`);
  }
  return valid;
};

const validateVariableOrInput = (container: Model.NodeContainer,
                                 node: Model.Variable | Model.Input): 'valid' |
    'invalid' | 'postpone' => {
  container.connections.outputs.set(
      'output', {shape: node.shape, valid: {state: 'valid'}});
  return 'valid';
};

const validateMatMul = (dict: Map<string, Model.NodeContainer>,
                        container: Model.NodeContainer,
                        node: Model.MatMul): 'valid' |
    'invalid' | 'postpone' => {
  let valid: 'valid'|'invalid' = 'valid';
  const multiplier = dict.get(node.inputs.multiplier);
  const multiplicand = dict.get(node.inputs.multiplicand);
  if (multiplier.connections === undefined ||
      multiplier.connections.outputs.size < 1) {
    // Do it later
    console.warn(`Skipped re-evaluating ${node.name} of type ${node.type}`);
    return 'postpone';
  }

  if (multiplicand.connections === undefined ||
      multiplicand.connections.outputs.size < 1) {
    // Do it later
    console.warn(`Skipped re-evaluating ${node.name} of type ${node.type}`);
    return 'postpone';
  }

  const multiplierShape = multiplier.connections.outputs.get('output').shape;
  const multiplicandShape =
      multiplicand.connections.outputs.get('output').shape;

  container.connections.inputs.set(
      'multiplicand', {shape: [], valid: {state: 'valid'}});
  container.connections.inputs.set(
      'multiplier', {shape: [], valid: {state: 'valid'}});

  if (multiplierShape.length === 2) {
    container.connections.outputs.set('output', {
      shape: [multiplierShape[multiplierShape.length - 1]],
      valid: {state: 'valid'}
    });

    container.connections.inputs.get('multiplicand').shape =
        [multiplierShape[0]];
    container.connections.inputs.get('multiplier').shape =
        [multiplicandShape[0], undefined];

    if (multiplicandShape.length !== 1) {
      valid = 'invalid';
      container.connections.inputs.get('multiplicand').valid = {
        state: 'invalid',
        reason:
            `Multiplicand must not have rank ${
                                               multiplicandShape.length
                                             } with multiplier of rank ${
                                                                         multiplierShape
                                                                             .length
                                                                       }`
      };
    } else {
      // First ranks dimension of multiplicand must mach first match first
      // ranks dimension of multiplier
      if (multiplierShape[0] !== multiplicandShape[0]) {
        valid = 'invalid';
        container.connections.inputs.get('multiplicand').valid = {
          state: 'invalid',
          reason:
              `Dimension of multiplier ${
                                         multiplierShape[0]
                                       } and multiplicand ${
                                                            multiplicandShape[0]
                                                          } do not match!`
        };
      }
    }
  } else {
    valid = 'invalid';
    console.error(
        `Multiplier of rank ${multiplierShape.length} not supported yet!`);
  }
  return valid;
};

const validateAdd = (dict: Map<string, Model.NodeContainer>,
                     container: Model.NodeContainer, node: Model.Add): 'valid' |
    'invalid' | 'postpone' => {
  let valid: 'valid'|'invalid' = 'valid';
  const first = dict.get(node.inputs['first-addend']);
  if (first.connections === undefined || first.connections.outputs.size < 1) {
    // Do it later
    console.warn(`Skipped re-evaluating ${node.name} of type ${node.type}`);
    return 'postpone';
  }

  const second = dict.get(node.inputs['second-addend']);
  if (second.connections === undefined || second.connections.outputs.size < 1) {
    // Do it later
    console.warn(`Skipped re-evaluating ${node.name} of type ${node.type}`);
    return 'postpone';
  }

  const firstShape = first.connections.outputs.get('output').shape;
  const secondShape = second.connections.outputs.get('output').shape;

  if (equalVector(firstShape, secondShape)) {
    container.connections.inputs.set(
        'second-addend', {shape: firstShape, valid: {state: 'valid'}});
    container.connections.inputs.set(
        'first-addend', {shape: secondShape, valid: {state: 'valid'}});
  } else {
    valid = 'invalid';
    const reason = `Dimensions do not match ${
                                              firstShape.join('x')
                                            } and ${secondShape.join('x')}`;

    container.connections.inputs.set(
        'second-addend', {shape: [], valid: {state: 'invalid', reason}});
    container.connections.inputs.set(
        'first-addend', {shape: [], valid: {state: 'invalid', reason}});
  }

  container.connections.outputs.set(
      'output', {shape: [...firstShape], valid: {state: 'valid'}});
  return valid;
};

const validateOutput =
    (dict: Map<string, Model.NodeContainer>, container: Model.NodeContainer,
     node: Model.Output): 'valid' |
    'invalid' | 'postpone' => {
      let valid: 'valid'|'invalid' = 'valid';
      container.connections.inputs.set(
          'input', {shape: [], valid: {state: 'valid'}});
      return valid;
    };

interface ValidationResponse {
  valid: boolean;
  connectionsWarnings:
      {inputs: Map<string, string>, outputs: Map<string, string>};
}

const validateShapesOfNode =
    (graph: Model.Graph, dict: Map<string, Model.NodeContainer>,
     container: Model.NodeContainer, outputShape: number[],
     inputShape?: number[]): ValidationResponse => {
      let validInSum = true;
      // const connectionsPatch:
      //     Model.ConnectionsInfo = {inputs: new Map(), outputs: new Map()};
      const connectionsWarnings: ValidationResponse['connectionsWarnings'] = {
        inputs: new Map(),
        outputs: new Map()
      };
      // Check processor
      if (inputShape !== undefined) {
        // TODO
      }
      // Check successor
      for (let successorIndex in container.node.outputs) {
        const successorName = container.node.outputs[successorIndex];
        const successorContainer = dict.get(successorName);
        // Which input are we?
        const inputName =
            _.toPairs((successorContainer.node as Model.OperationNode).inputs)
                .filter(s => s[1] === container.node.id)[0][0];
        const successorShapeConstraint =
            successorContainer.connections.inputs.get(inputName).shape;
        const validationMsg =
            validateShape(successorShapeConstraint, outputShape);
        if (validationMsg !== 'valid') {
          validInSum = false;
          connectionsWarnings.outputs.set('output', validationMsg);
        }
        // const shapeString = successorShapeConstraint
        //                         .map(s => s !== undefined ? s.toString() :
        //                         '?') .join('x');
        // console.log(`Successor Shape Constraint: ${shapeString}`);
        // console.log(`Shape is ${outputShape.join('x')}`);
        // console.log(`Is ${valid ? 'valid' : 'invalid'}`);
        // if (!valid) return {valid: false, connectionsWarnings};
      }
      return {valid: validInSum, connectionsWarnings};
    };

export const checkUpdateGraphNode =
    (payload: TryUpdateGraphNode, graph: Model.Graph,
     dict: Map<string, Model.NodeContainer>) => dispatch => {
      // TODO: If a shape mismatch gets changed check the whole chain down to
      // output
      // TODO(#1): Change the representation of the node such that his can be
      // done automatically
      // console.log(payload);
      const container = dict.get(payload.nodeId);
      const {node} = container;
      if (payload.nodeType === 'convolution') {
        if (payload.propertyName === 'rank') {
          console.warn(`Convolution nodes of rank ${
                                                    payload.newValue
                                                  } are not implemented yet`);
        } else {
          const newNode: Model.Convolution = {...node as Model.Convolution};
          newNode[payload.propertyName] = payload.newValue;

          const state = validateConvolution(dict, container, newNode);
          const valid = state === 'valid';
          const connectionsPatch:
              Model.ConnectionsInfo = {inputs: new Map(), outputs: new Map()};
          dispatch(updateGraphNode({...payload, valid, connectionsPatch}));
        }
      } else if (payload.nodeType === 'reshape') {
        const newNode = {...node as Model.Reshape};
        let newValue: [number, number]|string|number;
        if (payload.propertyName === 'shape') {
          newValue = parseShape(payload.newValue as string) as [number, number];
        } else {
          newValue = payload.newValue;
        }
        newNode[payload.propertyName] = newValue;
        const state = validateResharp(dict, container, newNode);
        const valid = state === 'valid';
        const connectionsPatch:
            Model.ConnectionsInfo = {inputs: new Map(), outputs: new Map()};
        dispatch(
            updateGraphNode({...payload, newValue, valid, connectionsPatch}));
      } else if (payload.nodeType === 'max-pool') {
        const newNode: Model.MaxPool = {...node as Model.MaxPool};
        let newValue: [number, number]|string|number;
        if (payload.propertyName === 'filterSize') {
          newValue = parseShape(payload.newValue as string) as [number, number];
        } else {
          newValue = payload.newValue;
        }
        newNode[payload.propertyName] = newValue;

        const state = validateMaxPooling(dict, container, newNode);
        const valid = state === 'valid';
        const connectionsPatch:
            Model.ConnectionsInfo = {inputs: new Map(), outputs: new Map()};
        dispatch(
            updateGraphNode({...payload, newValue, valid, connectionsPatch}));
      } else if (payload.nodeType === 'variable') {
        if (payload.propertyName === 'shape') {
          // Validate new node
          const shape = parseShape(payload.newValue as string);
          if (shape === undefined) return;
          const {valid, connectionsWarnings} =
              validateShapesOfNode(graph, dict, container, shape, undefined);
          // if (valid) return;
          const connectionsPatch:
              Model.ConnectionsInfo = {inputs: new Map(), outputs: new Map()};
          connectionsPatch.outputs.set(
              'output', {shape, valid: {state: 'valid'}});
          for (const k of connectionsWarnings.outputs.keys()) {
            connectionsPatch.outputs.get(k).valid = {
              state: 'invalid',
              reason: connectionsWarnings.outputs.get(k)
            };
          }

          dispatch(updateGraphNode(
              {...payload, newValue: shape, valid, connectionsPatch}));
        } else if (payload.propertyName === 'min') {
          if (node['max'] >= payload.newValue)
            dispatch(updateGraphNode({...payload, valid: true}));
        } else if (payload.propertyName === 'max') {
          if (node['min'] <= payload.newValue)
            dispatch(updateGraphNode({...payload, valid: true}));
        } else if (payload.propertyName === 'stdDev') {
          if (payload.newValue >= 0)
            dispatch(updateGraphNode({...payload, valid: true}));
        } else if (
            payload.propertyName === 'mean' ||
            payload.propertyName === 'init') {
          dispatch(updateGraphNode({...payload, valid: true}));
        } else {
          // dispatch(updateGraphNode(payload));
          console.warn(
              `Not implemented property change of ${payload.propertyName}`);
        }
      }
    };

const equalVector = (a: number[], b: number[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i in a) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const calculateShapes = (containers: Model.Graph['nodes']) => {
  const dict = createDictFromContainers(containers);
  // Every node validates its input shape matching with his own config
  let isValid = true;
  // Find input
  const queue: Model.NodeContainer[] = containers.filter(
      c => c.node.type === 'input' || c.node.type === 'variable');
  while (queue.length > 0) {
    const container = queue.shift();
    if (container === undefined) break;

    container.connections = {inputs: new Map(), outputs: new Map()};
    const {node} = container;

    let state: 'valid'|'invalid'|'postpone';
    if (node.type === 'input' || node.type === 'variable') {
      state = validateVariableOrInput(container, node);
    } else if (node.type === 'convolution') {
      state = validateConvolution(dict, container, node);
    } else if (node.type === 'relu') {
      state = validateRelu(dict, container, node);
    } else if (node.type === 'max-pool') {
      state = validateMaxPooling(dict, container, node);
    } else if (node.type === 'reshape') {
      state = validateResharp(dict, container, node);
    } else if (node.type === 'mat-mul') {
      state = validateMatMul(dict, container, node);
    } else if (node.type === 'add') {
      state = validateAdd(dict, container, node);
    } else if (node.type === 'output') {
      state = validateOutput(dict, container, node);
    }
    if (state === 'invalid')
      isValid = false;
    else if (state === 'postpone') {
      // Do it later
      console.warn(`Skipped re-evaluating ${node.name} of type ${node.type}`);
      continue;
    }

    queue.push(..._.values(node['outputs']).map(input => dict.get(input)));
  }
  return isValid;
};

export const loadScenario = (scenario: string) => dispatch => {
  // TODO: Load this from server
  const graph: SetGraphPayload = {
    newGraph: {loadedScenario: scenario, nodes: [], isValid: false}
  };
  console.log(`Loading scenario ${scenario}`);
  if (scenario === 'mnist') {
    const conv2OutputDepth = 16;
    const conv1OutputDepth = 8;
    const inputDepth = 1;

    graph.newGraph.nodes = [
      {
        node: {
          id: 'input',
          legend: [],
          name: 'input',
          outputs: ['conv2d-1'],
          shape: [28, 28, inputDepth],
          type: 'input'
        },
        position: {x: 50, y: 100},
        valid: true
      },
      {
        node: {
          type: 'variable',
          id: 'conv2d-1-weights',
          name: 'Conv 1 Kernel Weights',
          init: 'normal',
          outputs: ['conv2d-1'],
          shape: [5, 5, inputDepth, conv1OutputDepth],
          mean: 0.0,
          stdDev: 0.1
        },
        position: {x: 50, y: 200},
        valid: true
      },
      {
        node: {
          type: 'convolution',
          id: 'conv2d-1',
          filters: 8,
          inputs: {'orig': 'input', 'kernel': 'conv2d-1-weights'},
          name: 'Conv 1',
          outputs: ['relu-1'],
          strides: 1,
          rank: 2,
          padding: 'same'
        },
        position: {x: 400, y: 100},
        valid: true
      },
      {
        node: {
          type: 'relu',
          id: 'relu-1',
          name: 'ReLu 1',
          outputs: ['max-pool-1'],
          inputs: {'orig': 'conv2d-1'}
        },
        position: {x: 700, y: 100},
        valid: true
      },
      {
        node: {
          type: 'max-pool',
          filterSize: [2, 2],
          id: 'max-pool-1',
          name: 'Max Pooling 1',
          pad: 0,
          strides: 2,
          outputs: ['conv2d-2'],
          inputs: {'orig': 'relu-1'}
        },
        position: {x: 1000, y: 100},
        valid: true
      },
      {
        node: {
          type: 'variable',
          id: 'conv2d-2-weights',
          name: 'Conv 2 Kernel Weights',
          init: 'normal',
          outputs: ['conv2d-2'],
          shape: [5, 5, conv1OutputDepth, conv2OutputDepth],
          mean: 0.0,
          stdDev: 0.1
        },
        position: {x: 50, y: 400},
        valid: true
      },
      {
        node: {
          type: 'convolution',
          id: 'conv2d-2',
          filters: conv2OutputDepth,
          inputs: {'orig': 'max-pool-1', 'kernel': 'conv2d-2-weights'},
          name: 'Conv 2',
          outputs: ['relu-2'],
          strides: 1,
          rank: 2,
          padding: 'same'
        },
        position: {x: 400, y: 300},
        valid: true
      },
      {
        node: {
          type: 'relu',
          id: 'relu-2',
          name: 'ReLu 2',
          outputs: ['max-pool-2'],
          inputs: {'orig': 'conv2d-2'}
        },
        position: {x: 700, y: 300},
        valid: true
      },
      {
        node: {
          type: 'max-pool',
          filterSize: [2, 2],
          id: 'max-pool-2',
          name: 'Max Pooling 2',
          pad: 0,
          strides: 2,
          outputs: ['reshape-3'],
          inputs: {'orig': 'relu-2'}
        },
        position: {x: 1000, y: 300},
        valid: true
      },
      {
        node: {
          type: 'reshape',
          id: 'reshape-3',
          name: 'Reshape',
          inputs: {'orig': 'max-pool-2'},
          outputs: ['mat-mul-3'],
          shape: [7 * 7 * conv2OutputDepth]
        },
        position: {x: 400, y: 500},
        valid: true
      },
      {
        node: {
          type: 'variable',
          id: 'mat-mul-3-weight',
          name: 'Multiplication Weights',
          outputs: ['mat-mul-3'],
          shape: [7 * 7 * conv2OutputDepth, 10],
          init: 'normal',
          mean: 0,
          stdDev: 0.1
        },
        position: {x: 400, y: 700},
        valid: true
      },
      {
        node: {
          type: 'mat-mul',
          id: 'mat-mul-3',
          name: 'Multiplication',
          outputs: ['add-3'],
          inputs:
              {'multiplicand': 'reshape-3', 'multiplier': 'mat-mul-3-weight'}
        },
        position: {x: 700, y: 500},
        valid: true
      },
      {
        node: {
          type: 'variable',
          name: 'Addition Weights',
          id: 'add-3-weights',
          shape: [10],
          outputs: ['add-3'],
          init: 'zero'
        },
        position: {x: 700, y: 700},
        valid: true
      },
      {
        node: {
          type: 'add',
          id: 'add-3',
          name: 'Add',
          outputs: ['output'],
          inputs:
              {'first-addend': 'mat-mul-3', 'second-addend': 'add-3-weights'}
        },
        position: {x: 1000, y: 500},
        valid: true
      },
      {
        node: {
          type: 'output',
          id: 'output',
          inputs: {input: 'add-3'},
          name: 'Output',
          outputs: []
        },
        position: {x: 1200, y: 500},
        valid: true
      }
    ];

    graph.newGraph.isValid = calculateShapes(graph.newGraph.nodes);
  }
  dispatch(setGraph(graph));
};

const createRemoveConnectionPatch =
    (dict: Map<string, Model.NodeContainer>,
     action:
         {input: Endpoint, output: Endpoint}): UpdateGraphNodeConnections[] => {
      // Which nodes to change?
      const inputContainer = dict.get(action.input.nodeId) as
          Model.NodeContainer<Model.OperationNode>;
      const outputNode = dict.get(action.output.nodeId);
      // Which ports?
      const inputChannelName =
          _.toPairs(inputContainer.node.inputs)
              .find(([k, v], i) => i === action.input.port)[0];
      // Validate the nodes
      const inputPatch: UpdateGraphNodeConnections = {
        nodeId: action.input.nodeId,
        valid: false,
        connectionsPatch: {
          inputs: new Map(),
          outputs: new Map(),
          removeInputs: [inputChannelName]
        },
        nodePatch: {removeOutputs: [], removeInputs: [inputChannelName]}
      };

      const outputPatch: UpdateGraphNodeConnections = {
        nodeId: action.output.nodeId,
        valid: false,
        connectionsPatch:
            {inputs: new Map(), outputs: new Map(), removeOutputs: ['output']},
        nodePatch: {removeOutputs: [0], removeInputs: []}
      };

      return [inputPatch, outputPatch];
    };

export const removeConnection:
    ChunkActionType2<Map<string, Model.NodeContainer>, ChangeAction> =
        (dict, action) => dispatch => {
          if (action.type === 'ConnectionRemoved') {
            const graphConnections: UpdateGraphNodeConnections[] =
                createRemoveConnectionPatch(dict, action);

            dispatch(updateGraphNodes({graphConnections}));
          } else {
            console.error(
                `Action has type ${
                                   action.type
                                 } but should have 'ConnectionRemoved'`);
          }
        };

export const addConnection: ChunkActionType2<
    Map<string, Model.NodeContainer>,
    ChangeAction> = (dict, action) => dispatch => {

  if (action.type === 'ConnectionCreated') {
    const inputName = action.input.name;
    const outputName = action.output.name;
    // Is connection valid?
    const inputNode = dict.get(action.input.nodeId);
    const outputNode = dict.get(action.output.nodeId);
    const inputConstraint = inputNode.connections.inputs.get(inputName);
    const outputConstraint = outputNode.connections.outputs.get(outputName);
    const validationResponse =
        validateShapeConstraints(inputConstraint.shape, outputConstraint.shape);

    const valid = validationResponse === 'valid' ?
        {state: 'valid'} as Model.ValidationState :
        {state: 'invalid', reason: validationResponse} as Model.ValidationState;
    console.log('AddConnection');
    const inputConnectionPatch = new Map<string, Model.ConnectionConstraints>();
    inputConnectionPatch.set(inputName, {shape: inputConstraint.shape, valid});
    const inputNodePatch = new Map<string, string>();
    inputNodePatch.set(inputName, action.output.nodeId);

    const inputPatch: UpdateGraphNodeConnections = {
      nodeId: action.input.nodeId,
      nodePatch: {addInputs: inputNodePatch},
      connectionsPatch: {inputs: inputConnectionPatch, outputs: new Map()},
      valid: valid.state === 'valid'
    };

    const outputConnectionPatch =
        new Map<string, Model.ConnectionConstraints>();
    outputConnectionPatch.set(
        outputName, {shape: outputConstraint.shape, valid});
    const outputNodePatch = new Map<string, string>();
    outputNodePatch.set(outputName, action.input.nodeId);

    const outputPatch: UpdateGraphNodeConnections = {
      nodeId: action.output.nodeId,
      nodePatch: {addOutputs: outputNodePatch},
      connectionsPatch: {inputs: new Map(), outputs: outputConnectionPatch},
      valid: valid.state === 'valid'
    };

    const graphConnections: UpdateGraphNodeConnections[] =
        [inputPatch, outputPatch];

    dispatch(updateGraphNodes({graphConnections}));

  } else {
    console.error(
        `Action has type ${action.type} but should have 'ConnectionCreated'`);
  }
};

export const removeNode:
    ChunkActionType2<Map<string, Model.NodeContainer>, ChangeAction> =
        (dict, action) => dispatch => {
          if (action.type === 'NodeRemoved') {
            const graphConnections = action.correspondingConnections.reduce(
                (patches, conn) =>
                    patches.concat(createRemoveConnectionPatch(dict, conn)),
                []);

            dispatch(
                updateGraphNodes({graphConnections, removeNodes: [action.id]}));
            console.log(action);
          } else {
            console.error(
                `Action has type ${
                                   action.type
                                 } but should have 'ConnectionCreated'`);
          }
        };

export const updateGraphNodes =
    createAction<UpdateGraph>(Actions.GRAPH_UPDATE_NODES);