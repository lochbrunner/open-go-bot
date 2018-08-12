import {legend} from '../utilities/encoder';

// See
// https://stackoverflow.com/questions/40463060/turn-a-string-literal-type-to-a-literal-value
export type ActionTypes = {
  type: 'TEST',
  payload: {}
};

export function createInitialState(): Model.Graph {
  const output: Model.Node = {type: 'output', shape: [19 * 19], outputs: []};

  const conv2d1: Model.Convolution = {
    type: 'convolution',
    shape: [19, 19, 1],
    kernel: {size: 5},
    filters: 1,
    strides: 1,
    weights: Array(5 * 5 * 9).fill(0),
    activation: 'relu',
    outputs: []
  };

  const input:
      Model.Input = {type: 'input', legend, shape: [19, 19, 9], outputs: []};

  const flatten:
      Model.Flatten = {type: 'flatten', outputs: [], shape: [19 * 19]};

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