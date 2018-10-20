import {legend} from '../scenarios/go/encoder';  // TODO(mnist): Remove this dependency

// See
// https://stackoverflow.com/questions/40463060/turn-a-string-literal-type-to-a-literal-value
export type ActionTypes = {
  type: 'TEST',
  payload: {}
};

export function createInitialState(): Model.Graph {
  let id = 0;
  const output: Model.Node = {
    id: (id++).toString(),
    type: 'output',
    name: 'output',
    shape: [19 * 19],
    outputs: []
  };

  const conv2d1: Model.Convolution = {
    type: 'convolution',
    name: 'conv',
    id: (id++).toString(),
    shape: [19, 19, 1],
    kernel: {size: 5},
    filters: 1,
    strides: 1,
    weights: {
      kernel: Array(5 * 5 * 9 * 1).fill(0),
      bias: Array(1).fill(0)
    },  // width*height*input_channel*output_channel (= filter)
    activation: 'relu',
    outputs: []
  };

  const input: Model.Input = {
    type: 'input',
    name: 'input',
    id: (id++).toString(),
    legend,
    shape: [19, 19, 9],
    outputs: []
  };

  const flatten: Model.Flatten = {
    type: 'flatten',
    name: 'flatten',
    id: (id++).toString(),
    outputs: [],
    shape: [19 * 19]
  };

  conv2d1.input = input;
  input.outputs.push(conv2d1);

  flatten.input = conv2d1;
  conv2d1.outputs.push(flatten);

  output.input = flatten;
  flatten.outputs.push(output);

  return {input};
}

export const reducers: (state: RootState, action: ActionTypes) => RootState =
    (state: RootState, action: ActionTypes) => {
      if (action.type === 'TEST') {
        return state;
      }
      return state;
    };