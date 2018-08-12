import {legend} from '../utilities/encoder';

// See
// https://stackoverflow.com/questions/40463060/turn-a-string-literal-type-to-a-literal-value
export type ActionTypes = {
  type: 'TEST',
  payload: {}
};

export function createInitialState(): Model.Graph {
  const output: Model.Node = {type: 'output', shape: [19 * 19]};

  const conv2d1: Model.Convolution = {
    type: 'convolution',
    shape: [19, 19, 1],
    kernel: {size: 5},
    filters: 1,
    strides: 1,
    weights: [],
    activation: 'relu',
    outputs: [output]
  };

  return {
    input: {type: 'input', legend, shape: [19, 19, 9], outputs: [conv2d1]}
  };
}

export const reducers: (state: RootState, action: ActionTypes) => RootState =
    (state: RootState, action: ActionTypes) => {
      if (action.type === 'TEST') {
        return state;
      }
      return state;
    };