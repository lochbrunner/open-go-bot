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

function traverseGraphBackwards(graph: Model.Graph, callback: (node: Model.Node) => void) {
  if (graph === undefined || !graph.input)
    return;
  const dict = createDict(graph);
  // Add an unique index to each
  const queue: Model.Node[] = [graph.nodes.find(n => n.type === 'output')];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === undefined) break;
    if (node['inputs'] !== undefined) {

      queue.push(..._.values(node['inputs']).map(input => dict.get(input)));
    }
    callback(node);
  }
}

export class Graph extends React.Component<Graph.Props, Graph.State> {
  private model: tf.Model;

  constructor(props?: Graph.Props, context?: any) {
    super(props, context);
    this.model = props.graph.input ? createModel(props.graph) : undefined;
  }

  private resolver(dict: Map<string, Model.Node>, payload: { node: Model.Node }): JSX.Element {
    const { createFeatures, graph, inputLegend } = this.props;
    const { node } = payload;
    if (node.id === 'input') {
      const features = createFeatures();
      return <Tensor width={200} height={200} legend={inputLegend} features={features} />;
    }
    else if (node.type === 'variable') {
      if (node.init === 'normal') {
        return (
          <div className={`${node.type} ${node.init}`}>
            <h2>{node.type}</h2>
            <ul>
              <li>distribution {node.init}</li>
              <li>shape: {node.shape.join(' x ')}</li>
              <li>mean: {node.mean}</li>
              <li>stdDev: {node.stdDev}</li>
            </ul>
          </div>
        );
      }
      else if (node.init === 'uniform') {
        return (
          <div className={`${node.type} ${node.init}`}>
            <h2>{node.type}</h2>
            <ul>
              <li>distribution {node.init}</li>
              <li>shape: {node.shape.join(' x ')}</li>
              <li>min: {node.min}</li>
              <li>max: {node.max}</li>
            </ul>
          </div>
        );
      }
      else if (node.init === 'zero') {
        return (
          <div className={`${node.type} ${node.init}`}>
            <h2>{node.type}</h2>
            <ul>
              <li>distribution {node.init}</li>
              <li>shape: {node.shape.join(' x ')}</li>
            </ul>
          </div>
        );
      }
    }
    else if (node.type === 'convolution') {
      return (
        <div className={node.type}>
          <h2>{node.type}</h2>
          <ul>
            <li>filters {node.filters}</li>
            <li>strides: {node.strides}</li>
            <li>depth: {node.depth}</li>
          </ul>
        </div>
      );
    }
    else if (node.type === 'relu') {
      return (
        <div className={node.type}>
          <h2>{node.type}</h2>
        </div>
      );
    }
    else if (node.type === 'max-pool') {
      return (
        <div className={node.type}>
          <h2>{node.type}</h2>
          <ul>
            <li>filterSize {node.filterSize.join(' x ')}</li>
            <li>strides: {node.strides}</li>
            <li>padding: {node.pad}</li>
          </ul>
        </div>
      );
    }
    else if (node.type === 'mat-mul' || node.type === 'add') {
      return (
        <div className={node.type}>
          <h2>{node.type}</h2>
        </div>
      );
    }
    else if (node.type === 'reshape') {
      return (
        <div className={node.type}>
          <h2>{node.type}</h2>
          <ul>
            <li>shape: {node.shape.join(' x ')}</li>
          </ul>
        </div>
      );
    }
    // else if (node.id === 'output') {
    //   const features = createFeatures();
    //   const predictionTensor = this.model.predict(tf.tensor3d(features).reshape([-1, 19, 19, 9]));
    //   let prediction: { array: number[], shape: number[] } = { array: [], shape: [] };
    //   if (predictionTensor instanceof Array) {
    //     prediction.array = Array.from(predictionTensor[0].dataSync());
    //     prediction.shape = [19, 19, 1];
    //   }
    //   else {
    //     prediction.array = Array.from(predictionTensor.dataSync());
    //     prediction.shape = [19, 19, 1];
    //   }
    //   return <Tensor width={200} height={200} features={prediction} />;
    // }
    else if (node.id === 'conv') {
      // Find the correct conv node
      const convNode = findFirst(dict, dict.get(graph.input), n => n.type === 'convolution') as Model.Convolution;
      const kernelNode = dict.get(convNode.inputs[1]) as Model.Variable;
      return <Tensor width={100} height={100} legend={inputLegend} features={{ shape: kernelNode.shape, array: convNode.weights.kernel }} />;
    }
    return <span style={{ width: '140px' }}>Nothing to display</span>;
  }

  private onGraphChanged(action: ChangeAction) {
    if (action.type === 'ConnectionRemoved') {
      // TODO
    } else if (action.type === 'ConnectionCreated') {
      // TODO
    } else if (action.type === 'NodeRemoved') {
      // TODO
    } else if (action.type === 'NodeCreated') {
      // TODO
    }

  }

  render(): JSX.Element {
    const { graph } = this.props;
    loadWeightsFromGraph(graph, this.model);
    const dict = createDict(graph);

    const nodes: Node[] = [];

    traverseGraphBackwards(graph, node => {
      const id = `${node.name}.${node.id}`;
      const createId = (n: Model.Node) => `${n.name}.${n.id}`;
      const inputs = node['inputs'] !== undefined ? _.toPairs((node as Model.OperationNode).inputs).map(([inputName, inputNode]) => ({ connection: [{ nodeId: createId(dict.get(inputNode)), port: 0 }], name: inputName })) : [];
      const outputs = node.outputs.filter(o => o !== 'result').map((o, i) => ({ connection: [{ nodeId: createId(dict.get(o)), port: i }], name: 'output' }));
      nodes.push({
        id,
        properties: { display: 'only-dots' },
        classNames: [node.type],
        name: node.name,
        payload: { node },
        type: node.type,
        inputs,
        outputs
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
        <Editor style={{ height: '100%', width: '100%' }}
          config={graphConfig} nodes={nodes} />
      </div>
    );
  }
}