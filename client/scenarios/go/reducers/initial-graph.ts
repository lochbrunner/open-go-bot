import {legend} from '../encoder';

export default function createInitialState(): Model.Graph {
  let id = 0;
  const nodes = [];
  const output: Model.Node =
      {id: (id++).toString(), type: 'output', name: 'output', outputs: []};
  nodes.push(output);

  const conv2d1: Model.Convolution = {
    type: 'convolution',
    name: 'conv',
    id: (id++).toString(),
    kernel: [5, 5, 9],
    filters: 1,
    strides: 1,
    weights: {
      kernel: Array(5 * 5 * 9 * 1).fill(0),
      bias: Array(1).fill(0)
    },  // width*height*input_channel*output_channel (= filter)
    activation: 'relu',
    depth: 999,
    outputs: []
  };
  nodes.push(conv2d1);

  const input: Model.Input = {
    type: 'input',
    name: 'input',
    id: (id++).toString(),
    legend,
    shape: [19, 19, 9],
    outputs: []
  };
  nodes.push(input);

  const flatten: Model.Flatten =
      {type: 'flatten', name: 'flatten', id: (id++).toString(), outputs: []};
  nodes.push(flatten);

  conv2d1.input = input.id;
  input.outputs.push(conv2d1.id);

  flatten.input = conv2d1.id;
  conv2d1.outputs.push(flatten.id);

  output.input = flatten.id;
  flatten.outputs.push(output.id);

  return {input: input.id, nodes};
}