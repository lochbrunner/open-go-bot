import * as React from "react";
import * as _ from 'lodash';
import * as encoder from '../../utilities/encoder';
import * as tf from '@tensorflow/tfjs';

import { Editor, Node, Config, MenuItem } from 'react-flow-editor';

import { createModel, loadWeightsFromGraph } from '../../utilities/tf-model';

import { Tensor } from './tensor';

import './index.scss';

export namespace Graph {
  export interface Props {
    game: Game;
    graph: Model.Graph;
  }
  export interface State {
  }
}

function findFirst(start: Model.Node, predicate: (node: Model.Node) => boolean) {
  const nodes = [start];
  while (nodes.length > 0) {
    const node = nodes.pop();
    if (predicate(node)) return node;
    nodes.push(...node.outputs);
  }
  return undefined;
}

const nodes: Node[] = [
  {
    id: 'input',
    name: 'Input Tensor',
    inputs: [],
    outputs: [{
      connection: [{ nodeId: 'convolution_1', port: 0 }], name: ''
    }],
    type: 'tensor',
    payload: { id: 'input' }
  },
  {
    id: 'prediction',
    name: 'Prediction Tensor',
    inputs: [{
      connection: [{ nodeId: 'convolution_1', port: 0 }], name: ''
    }],
    outputs: [],
    payload: { id: 'prediction' },
    type: 'tensor'
  },
  {
    id: 'convolution_1',
    name: 'First Convolution',
    inputs: [{
      connection: [{ nodeId: 'input', port: 0 }], name: ''
    }],
    outputs: [{
      connection: [{ nodeId: 'prediction', port: 0 }], name: ''
    }],
    payload: { id: 'convolution_1' },
    type: 'tensor'
  }
];

export class Graph extends React.Component<Graph.Props, Graph.State> {
  private model: tf.Model;

  constructor(props?: Graph.Props, context?: any) {
    super(props, context);
    this.model = createModel(props.graph);
  }

  render(): JSX.Element {
    const graphConfig: Config = {
      resolver: payload => {
        const { game, graph } = this.props;
        if (payload.id === 'input') {
          const features = encoder.createFeatures(game);
          return <Tensor width={200} height={200} position={{ left: 0, top: 20 }} legend={encoder.legend} features={features} />;
        }
        else if (payload.id === 'prediction') {
          const features = encoder.createFeatures(game);
          loadWeightsFromGraph(graph, this.model);
          const predictionTensor = this.model.predict(tf.tensor3d(features).reshape([-1, 19, 19, 9]));
          let prediction: { array: number[], shape: number[] } = { array: [], shape: [] };
          if (predictionTensor instanceof Array) {
            prediction.array = Array.from(predictionTensor[0].dataSync());
            prediction.shape = [19, 19, 1];
          }
          else {
            prediction.array = Array.from(predictionTensor.dataSync());
            prediction.shape = [19, 19, 1];
          }
          return <Tensor width={200} height={200} position={{ left: 0, top: 420 }} features={prediction} />;
        }
        else if (payload.id === 'convolution_1') {
          // Find the correct conv node
          const convNode = findFirst(graph.input, node => node.type === 'convolution') as Model.Convolution;
          return <Tensor width={100} height={100} position={{ left: 0, top: 270 }} legend={encoder.legend} features={{ shape: [convNode.kernel.size, convNode.kernel.size, 9], array: convNode.weights.kernel }} />;
        }
        return <span></span>;
      },
      connectionType: 'bezier',
      grid: true
    };

    return <div className="workspace">
      <Editor style={{ height: '100%', width: '100%' }} config={graphConfig} nodes={nodes} />
    </div>;
  }
}