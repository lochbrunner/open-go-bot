import * as React from "react";
import * as _ from 'lodash';
import * as encoder from '../../utilities/encoder';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import * as tf from '@tensorflow/tfjs';

import { createModel, loadWeightsFromGraph } from '../../utilities/tf-model';

import { Tensor } from './tensor';

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

export class Graph extends React.Component<Graph.Props, Graph.State> {
  private model: tf.Model;

  constructor(props?: Graph.Props, context?: any) {
    super(props, context);
    this.model = createModel(props.graph);
  }

  render(): JSX.Element {
    const { game, graph } = this.props;
    const features = encoder.createFeatures(game);

    loadWeightsFromGraph(graph, this.model);
    const predictionTensor = this.model.predict(tf.tensor3d(features).reshape([-1, 19, 19, 9]));
    let prediction: { array: number[], shape: number[] } = { array: [], shape: [] };
    if (predictionTensor instanceof Array) {
      console.log('predictionTensor is array!');
      prediction.array = Array.from(predictionTensor[0].dataSync());
      prediction.shape = [19, 19, 1];
      console.log(prediction.shape);
    }
    else {
      prediction.array = Array.from(predictionTensor.dataSync());
      prediction.shape = [19, 19, 1];
    }

    // Find the correct conv node
    const convNode = findFirst(graph.input, node => node.type === 'convolution') as Model.Convolution;

    return <div className="workspace">
      <Tensor width={200} height={200} position={{ left: 0, top: 20 }} legend={encoder.legend} features={features} />
      <Tensor width={100} height={100} position={{ left: 0, top: 270 }} legend={encoder.legend} features={{ shape: [convNode.kernel.size, convNode.kernel.size, 9], array: convNode.weights.kernel }} />
      <Tensor width={200} height={200} position={{ left: 0, top: 420 }} features={prediction} />
    </div>;
  }
}