import * as tf from '@tensorflow/tfjs';
import {Variable} from '@tensorflow/tfjs';
import {TextureConfig} from '@tensorflow/tfjs-core/dist/kernels/webgl/gpgpu_util';
import {assert, assertShapesMatch} from '@tensorflow/tfjs-core/dist/util';
import {Tensor} from '../components/graph/tensor';

function calcWeightsSize(node: Model.Node) {
  if (node.type === 'convolution') {
    const inputShape = node.input.shape;
    return node.kernel.size * node.kernel.size * node.filters *
        inputShape[inputShape.length - 1];
  }
  return 0;
}

export function createModel(graph: Model.Graph) {
  const model = tf.sequential();
  // const layers: Map<string, Model.Node> = new Map<string, Model.Node>();

  let nodes: Model.Node[] = [graph.input];

  while (nodes.length > 0) {
    const node = nodes.pop();
    if (node.type === 'convolution') {
      model.add(tf.layers.conv2d({
        inputShape: node.input.shape,
        filters: node.filters,
        kernelSize: node.kernel.size,
        strides: node.strides,
        activation: node.activation,
        padding: 'same',
        kernelInitializer: 'VarianceScaling',
        useBias: true,
        name: node.name
      }));
      // layers.set(node.name, node);
    } else if (node.type === 'flatten') {
      model.add(tf.layers.flatten({name: 'flatten'}));
      // layers.set(node.name, node);
    }
    nodes.push(...node.outputs);
  }

  const LEARNING_RATE = 0.015;
  const optimizer = tf.train.sgd(LEARNING_RATE);

  model.compile({
    optimizer: optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

function nodesMap(graph: Model.Graph) {
  const map = new Map<string, Model.Node>();
  const nodes: Model.Node[] = [graph.input];
  while (nodes.length > 0) {
    const node = nodes.pop();
    map.set(node.name, node);
    nodes.push(...node.outputs);
  }
  return map;
}

export function writeWeightsToGraph(graph: Model.Graph, model: tf.Model) {
  const nodes = nodesMap(graph);

  for (let layer of model.layers) {
    if (layer.trainable) {
      const node = nodes.get(layer.name);
      if (node.type === 'convolution') {
        // First is kernel, second bias
        const [kernel, bias] = layer.getWeights(true) as Variable[];
        const inputChannels = node.input.shape[node.input.shape.length - 1];
        assertShapesMatch(
            kernel.shape,
            [node.kernel.size, node.kernel.size, inputChannels, node.filters]);
        assertShapesMatch(bias.shape, [node.filters]);
        assert(
            kernel.name.indexOf(`${layer.name}/kernel`) === 0,
            `Expected variable name to be '${
                                             layer.name
                                           }/kernel' but is actual ${
                                                                     kernel.name
                                                                   }`);
        assert(
            bias.name.indexOf(`${layer.name}/bias`) === 0,
            `Expected variable name to be '${
                                             layer.name
                                           }/kernel' but is actual ${
                                                                     bias.name
                                                                   }`);
        node.weights.kernel = Array.from(kernel.dataSync());
        node.weights.bias = Array.from(bias.dataSync());
      }
    }
  }
  return graph;
}

export function loadWeightsFromGraph(graph: Model.Graph, model: tf.Model) {
  const nodes = nodesMap(graph);

  for (let layer of model.layers) {
    if (layer.trainable) {
      const node = nodes.get(layer.name);
      if (node.type === 'convolution') {
        const inputChannels = node.input.shape[node.input.shape.length - 1];
        // First is kernel, second bias
        const kernel = tf.tensor(
            node.weights.kernel,
            [node.kernel.size, node.kernel.size, inputChannels, node.filters]);
        const bias = tf.tensor(node.weights.bias, [node.filters]);
        layer.setWeights([kernel, bias]);
      }
    }
  }
  return model;
}