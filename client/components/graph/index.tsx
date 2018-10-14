import * as React from "react";
import * as _ from 'lodash';
import * as encoder from '../../utilities/encoder';
import * as tf from '@tensorflow/tfjs';

import { Editor, Node, Config, ChangeAction } from 'react-flow-editor';

import { createModel, loadWeightsFromGraph } from '../../utilities/tf-model';

import { Tensor } from './tensor';

import './index.scss';
import { configureStore } from "../../store";

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

function traverseGraph(input: Model.Node, callback: (node: Model.Node) => void) {
  // Add an unique index to each
  const queue = [input];
  while (queue.length > 0) {
    const node = queue.shift();
    queue.push(...node.outputs);
    callback(node);
  }
}

export class Graph extends React.Component<Graph.Props, Graph.State> {
  private model: tf.Model;

  constructor(props?: Graph.Props, context?: any) {
    super(props, context);
    this.model = createModel(props.graph);
  }

  private resolver(payload: any): JSX.Element {
    const { game, graph } = this.props;
    if (payload.id === 'input') {
      const features = encoder.createFeatures(game);
      return <Tensor width={200} height={200} legend={encoder.legend} features={features} />;
    }
    else if (payload.id === 'output') {
      const features = encoder.createFeatures(game);
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
      return <Tensor width={200} height={200} features={prediction} />;
    }
    else if (payload.id === 'conv') {
      // Find the correct conv node
      const convNode = findFirst(graph.input, node => node.type === 'convolution') as Model.Convolution;
      return <Tensor width={100} height={100} legend={encoder.legend} features={{ shape: [convNode.kernel.size, convNode.kernel.size, 9], array: convNode.weights.kernel }} />;
    }
    return <span>Nothing to display</span>;
  }

  private onGraphChanged(action: ChangeAction) {
    if (action.type === 'ConnectionRemoved') {

    }
  }

  render(): JSX.Element {
    const { game, graph } = this.props;
    loadWeightsFromGraph(graph, this.model);

    const nodes: Node[] = [];

    traverseGraph(graph.input, node => {
      const id = `${node.name}.${node.id}`;
      const createId = (n: Model.Node) => `${n.name}.${n.id}`;
      nodes.push({
        id,
        name: node.name,
        payload: { id: node.name },
        type: node.type,
        inputs: node.input ? [{ connection: [{ nodeId: createId(node.input), port: 0 }], name: '' }] : [],
        outputs: node.outputs.map((o, i) => ({ connection: [{ nodeId: createId(o), port: i }], name: '' }))
      });
    });

    const graphConfig: Config = {
      resolver: this.resolver.bind(this),
      connectionType: 'bezier',
      onChanged: this.onGraphChanged.bind(this),
      grid: false,
      direction: 'ew'
    };

    return (
      <div className="workspace">
        <Editor style={{ height: '100%', width: '100%' }}
          config={graphConfig} nodes={nodes} />
      </div>
    );
  }
}