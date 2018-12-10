import * as _ from 'lodash';
import {createAction} from 'redux-actions';

import * as Actions from '../constants/actions';
import {createDictFromContainers, createDictFromGraph} from '../utilities/toolbox';

export interface SetGraphPayload { newGraph: Model.Graph; }

export interface UpdateGraphNode {
  nodeId: string;
  nodeType: Model.Node['type'];
  propertyName: string;
  newValue: number|string;
}
export type GraphPayload = SetGraphPayload|UpdateGraphNode;

export const setGraph = createAction<SetGraphPayload>(Actions.GRAPH_SET);

export const updateGraphNode =
    createAction<UpdateGraphNode>(Actions.GRAPH_UPDATE_NODE);

export const parseShape = (shapeString: string): number[] | undefined => {
  try {
    return shapeString.split('x').map(c => parseInt(c));
  } catch (e) {
    return undefined;
  }
};

const validateShape = (constraint: (number|undefined)[], shape: number[]) => {
  if (constraint.length === 0) return true;
  if (constraint.length !== shape.length) return false;
  for (let i = 0; i < constraint.length; ++i) {
    if (constraint[i] === undefined) continue;
    if (constraint[i] !== shape[i]) return false;
  }
  return true;
};

const validateVariableOrInput =
    (container: Model.NodeContainer, node: Model.Variable | Model.Input) => {
      container.connections.outputs.set(
          'output', {shape: node.shape, valid: {state: 'valid'}});
    };

const validateNode =
    (graph: Model.Graph, dict: Map<string, Model.NodeContainer>,
     container: Model.NodeContainer, outputShape: number[],
     inputShape?: number[]): boolean => {
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
        const valid = validateShape(successorShapeConstraint, outputShape);
        const shapeString = successorShapeConstraint
                                .map(s => s !== undefined ? s.toString() : '?')
                                .join('x');
        console.log(`Successor Shape Constraint: ${shapeString}`);
        console.log(`Shape is ${outputShape.join('x')}`);
        console.log(`Is ${valid ? 'valid' : 'invalid'}`);
        if (!valid) return false;
      }
      return true;
    };

export const checkUpdateGraphNode =
    (payload: UpdateGraphNode, graph: Model.Graph,
     dict: Map<string, Model.NodeContainer>) => dispatch => {
      console.log(payload);
      const container = dict.get(payload.nodeId);
      const {node} = container;
      if (payload.nodeType === 'convolution') {
      } else if (payload.nodeType === 'variable') {
        if (payload.propertyName === 'shape') {
          // Validate new node
          const shape = parseShape(payload.newValue as string);
          if (shape === undefined) return;
          if (!validateNode(graph, dict, container, shape, undefined)) return;
          dispatch(updateGraphNode(payload));
        } else if (payload.propertyName === 'min') {
          if (node['max'] >= payload.newValue)
            dispatch(updateGraphNode(payload));
        } else if (payload.propertyName === 'max') {
          if (node['min'] <= payload.newValue)
            dispatch(updateGraphNode(payload));
        } else if (payload.propertyName === 'stdDev') {
          if (payload.newValue >= 0) dispatch(updateGraphNode(payload));
        } else if (
            payload.propertyName === 'mean' ||
            payload.propertyName === 'init') {
          dispatch(updateGraphNode(payload));
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

    if (node.type === 'input' || node.type === 'variable') {
      validateVariableOrInput(container, node);
    }

    else if (node.type === 'convolution') {
      // If the shape of one input is not there enqueue it.
      const orig = dict.get(node.inputs.orig);
      const kernel = dict.get(node.inputs.kernel);
      if (orig.connections === undefined || orig.connections.outputs.size < 1 ||
          kernel.connections === undefined ||
          kernel.connections.outputs.size < 1) {
        // Do it later
        console.warn(`Skipped re-evaluating ${node.name} of type ${node.type}`);
        continue;
      }
      const {strides} = node;
      const origShape = orig.connections.outputs.get('output').shape;
      const kernelShape = kernel.connections.outputs.get('output').shape;
      if (node.rank === 2) {
        if (node.padding === 'same') {
          // Ignore own filter settings
          const shape = [
            Math.floor(origShape[0] / strides),
            Math.floor(origShape[1] / strides), kernelShape[3]
          ];
          container.connections.outputs.set(
              'output', {shape, valid: {state: 'valid'}});

          // Validate orig and kernel shape
          // orig
          container.connections.inputs.set(
              'orig', {shape: [], valid: {state: 'valid'}});
          // kernel
          container.connections.inputs.set(
              'kernel', {shape: [], valid: {state: 'valid'}});
          // Any of them broken ?
          if (kernelShape.length !== 4 || origShape.length !== 3) {
            if (kernelShape.length !== 4) {
              isValid = false;
              container.connections.inputs.get('kernel').valid = {
                state: 'invalid',
                reason: 'Kernel must be of rank 4'
              };
            } else {  // => if (origShape.length !== 3)
              isValid = false;
              container.connections.inputs.get('orig').valid = {
                state: 'invalid',
                reason: 'Input must be of rank 3'
              };
            }
          }
          // Do they fit together?
          else {
            container.connections.inputs.get('orig').shape = [undefined];
            if (origShape[2] !== kernelShape[2]) {
              container.connections.inputs.get('kernel').valid = {
                state: 'invalid',
                reason: `Third dimension must be ${origShape[2]}`
              };
              container.connections.inputs.get('orig').valid = {
                state: 'invalid',
                reason: `Third dimension must be ${kernelShape[2]}`
              };
              isValid = false;
            } else {
              // Everything is fine
              // orig
              container.connections.inputs.get('orig').shape =
                  [undefined, undefined, kernelShape[2]];
              // kernel
              container.connections.inputs.get('kernel').shape =
                  [undefined, undefined, kernelShape[2], node.filters];
            }
          }

        } else {
          isValid = false;
          console.error(
              `Convolution with padding ${node.padding} not supported yet!`);
        }
      } else {
        isValid = false;
        console.error(`Convolution of rank ${node.rank} not supported yet!`);
      }
    }

    else if (node.type === 'relu') {
      const orig = dict.get(node.inputs.orig);
      if (orig.connections === undefined || orig.connections.outputs.size < 1) {
        // Do it later
        console.warn(`Skipped re-evaluating ${node.name} of type ${node.type}`);
        continue;
      }
      container.connections.inputs.set(
          'orig', {shape: [], valid: {state: 'valid'}});
      container.connections.outputs.set('output', {
        shape: [...orig.connections.outputs.get('output').shape],
        valid: {state: 'valid'}
      });
    }

    else if (node.type === 'max-pool') {
      const orig = dict.get(node.inputs.orig);
      if (orig.connections === undefined || orig.connections.outputs.size < 1) {
        // Do it later
        console.warn(`Skipped re-evaluating ${node.name} of type ${node.type}`);
        continue;
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
      container.connections.outputs.set(
          'output', {shape, valid: {state: 'valid'}});
      // TODO(Matthias): Validate Max Pooling
      container.connections.inputs.set(
          'orig', {shape: [undefined], valid: {state: 'valid'}});
    }

    else if (node.type === 'reshape') {
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
        isValid = false;
        container.connections.inputs.set(
            'output',
            {shape: [], valid: {state: 'invalid', reason: 'Not validated'}});
      }
    }

    else if (node.type === 'mat-mul') {
      const multiplier = dict.get(node.inputs.multiplier);
      const multiplicand = dict.get(node.inputs.multiplicand);
      if (multiplier.connections === undefined ||
          multiplier.connections.outputs.size < 1) {
        // Do it later
        console.warn(`Skipped re-evaluating ${node.name} of type ${node.type}`);
        continue;
      }

      if (multiplicand.connections === undefined ||
          multiplicand.connections.outputs.size < 1) {
        // Do it later
        console.warn(`Skipped re-evaluating ${node.name} of type ${node.type}`);
        continue;
      }

      const multiplierShape =
          multiplier.connections.outputs.get('output').shape;
      const multiplicandShape =
          multiplicand.connections.outputs.get('output').shape;

      // multiplicand
      container.connections.inputs.set(
          'multiplicand', {shape: [], valid: {state: 'valid'}});
      // multiplier
      container.connections.inputs.set(
          'multiplier', {shape: [], valid: {state: 'valid'}});

      if (multiplierShape.length === 2) {
        container.connections.outputs.set('output', {
          shape: [multiplierShape[multiplierShape.length - 1]],
          valid: {state: 'valid'}
        });

        // multiplicand
        container.connections.inputs.get('multiplicand').shape =
            [multiplierShape[0]];
        // multiplier
        container.connections.inputs.get('multiplier').shape =
            [multiplicandShape[0], undefined];

        if (multiplicandShape.length !== 1) {
          isValid = false;
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
            isValid = false;
            container.connections.inputs.get('multiplicand').valid = {
              state: 'invalid',
              reason:
                  `Dimension of multiplier ${
                                             multiplierShape[0]
                                           } and multiplicand ${
                                                                multiplicandShape
                                                                    [0]
                                                              } do not match!`
            };
          }
        }
      } else {
        isValid = false;
        console.error(
            `Multiplier of rank ${multiplierShape.length} not supported yet!`);
      }
    }

    else if (node.type === 'add') {
      const first = dict.get(node.inputs['first-addend']);
      if (first.connections === undefined ||
          first.connections.outputs.size < 1) {
        // Do it later
        console.warn(`Skipped re-evaluating ${node.name} of type ${node.type}`);
        continue;
      }

      const second = dict.get(node.inputs['second-addend']);
      if (second.connections === undefined ||
          second.connections.outputs.size < 1) {
        // Do it later
        console.warn(`Skipped re-evaluating ${node.name} of type ${node.type}`);
        continue;
      }

      const firstShape = first.connections.outputs.get('output').shape;
      const secondShape = second.connections.outputs.get('output').shape;

      if (equalVector(firstShape, secondShape)) {
        // second
        container.connections.inputs.set(
            'second', {shape: firstShape, valid: {state: 'valid'}});
        // first
        container.connections.inputs.set(
            'first', {shape: secondShape, valid: {state: 'valid'}});
      } else {
        isValid = false;
        const reason = `Dimensions do not match ${
                                                  firstShape.join('x')
                                                } and ${secondShape.join('x')}`;
        // second
        container.connections.inputs.set(
            'second', {shape: [], valid: {state: 'invalid', reason}});
        // first
        container.connections.inputs.set(
            'first', {shape: [], valid: {state: 'invalid', reason}});
      }

      container.connections.outputs.set(
          'output', {shape: [...firstShape], valid: {state: 'valid'}});
    }

    else if (node.type === 'output') {
      container.connections.inputs.set(
          'orig', {shape: [], valid: {state: 'valid'}});
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
        position: {x: 50, y: 100}
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
        position: {x: 50, y: 200}
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
        position: {x: 400, y: 100}
      },
      {
        node: {
          type: 'relu',
          id: 'relu-1',
          name: 'ReLu 1',
          outputs: ['max-pool-1'],
          inputs: {'orig': 'conv2d-1'}
        },
        position: {x: 700, y: 100}
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
        position: {x: 1000, y: 100}
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
        position: {x: 50, y: 400}
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
        position: {x: 400, y: 300}
      },
      {
        node: {
          type: 'relu',
          id: 'relu-2',
          name: 'ReLu 2',
          outputs: ['max-pool-2'],
          inputs: {'orig': 'conv2d-2'}
        },
        position: {x: 700, y: 300}
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
        position: {x: 1000, y: 300}
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
        position: {x: 400, y: 500}
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
        position: {x: 400, y: 700}
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
        position: {x: 700, y: 500}
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
        position: {x: 700, y: 700}
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
        position: {x: 1000, y: 500}
      },
      {
        node: {
          type: 'output',
          id: 'output',
          inputs: {input: 'add-3'},
          name: 'Output',
          outputs: []
        },
        position: {x: 1200, y: 500}
      }
    ];

    graph.newGraph.isValid = calculateShapes(graph.newGraph.nodes);
  }
  dispatch(setGraph(graph));
};