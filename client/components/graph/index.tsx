import * as React from "react";
import * as _ from 'lodash';
import * as tf from '@tensorflow/tfjs';

import { Editor, Node, Config, ChangeAction } from 'react-flow-editor';

import { createModel, loadWeightsFromGraph } from '../../utilities/tf-model';

import { Tensor } from './tensor';

import './index.scss';

function createDict(graph: Model.Graph): Map<string, Model.Node> {
  const dict = new Map<string, Model.Node>();
  graph.nodes.forEach(node => dict.set(node.id, node));
  return dict;
}

export namespace Graph {
  export interface Props {
    createFeatures: () => number[][][];
    inputLegend: string[];
    graph: Model.Graph;
  }
  export interface State {
  }
}

function findFirst(dict: Map<string, Model.Node>, start: Model.Node, predicate: (node: Model.Node) => boolean) {
  const nodes = [start];
  while (nodes.length > 0) {
    const node = nodes.pop();
    if (predicate(node)) return node;
    nodes.push(...node.outputs.map(output => dict.get(output)));
  }
  return undefined;
}

function traverseGraph(graph: Model.Graph, callback: (node: Model.Node) => void) {
  if (graph === undefined || !graph.input)
    return;
  const dict = createDict(graph);
  // Add an unique index to each
  const queue = [dict.get(graph.input)];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === undefined) break;
    queue.push(...node.outputs.map(output => dict.get(output)));
    callback(node);
  }
}

export class Graph extends React.Component<Graph.Props, Graph.State> {
  private model: tf.Model;

  constructor(props?: Graph.Props, context?: any) {
    super(props, context);
    this.model = props.graph.input ? createModel(props.graph) : undefined;
  }

  private resolver(dict: Map<string, Model.Node>, payload: any): JSX.Element {
    const { createFeatures, graph, inputLegend } = this.props;
    if (payload.id === 'input') {
      const features = createFeatures();
      return <Tensor width={200} height={200} legend={inputLegend} features={features} />;
    }
    else if (payload.id === 'output') {
      const features = createFeatures();
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
      const convNode = findFirst(dict, dict.get(graph.input), node => node.type === 'convolution') as Model.Convolution;
      return <Tensor width={100} height={100} legend={inputLegend} features={{ shape: convNode.kernel, array: convNode.weights.kernel }} />;
    }
    return <span>Nothing to display</span>;
  }

  private onGraphChanged(action: ChangeAction) {
    if (action.type === 'ConnectionRemoved') {

    }
  }

  render(): JSX.Element {
    const { graph } = this.props;
    loadWeightsFromGraph(graph, this.model);
    const dict = createDict(graph);

    const nodes: Node[] = [];

    traverseGraph(graph, node => {
      const id = `${node.name}.${node.id}`;
      const createId = (n: Model.Node) => `${n.name}.${n.id}`;
      nodes.push({
        id,
        name: node.name,
        payload: { id: node.name },
        type: node.type,
        inputs: node.input ? [{ connection: [{ nodeId: createId(dict.get(node.input)), port: 0 }], name: '' }] : [],
        outputs: node.outputs.filter(o => o !== 'result').map((o, i) => ({ connection: [{ nodeId: createId(dict.get(o)), port: i }], name: '' }))
      });
    });

    const graphConfig: Config = {
      resolver: this.resolver.bind(this, dict),
      connectionType: 'bezier',
      onChanged: this.onGraphChanged.bind(this),
      grid: false,
      direction: 'ew'
    };

    return (
      <div className="workspace">
        {/* <Editor style={{ height: '100%', width: '100%' }}
          config={graphConfig} nodes={nodes} /> */}
      </div>
    );
  }
}