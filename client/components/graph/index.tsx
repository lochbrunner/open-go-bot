import * as React from "react";
import * as _ from 'lodash';
import * as tf from '@tensorflow/tfjs';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import "react-tabs/style/react-tabs.css";

import { Editor, Node, Config, ChangeAction } from 'react-flow-editor';

import { createModel, loadWeightsFromGraph } from '../../utilities/tf-model';

import { Tensor } from './tensor';
import * as GraphActions from '../../actions/graph';

import './index.scss';

function createDict(graph: Model.Graph): Map<string, Model.Node> {
  const dict = new Map<string, Model.Node>();
  graph.nodes.forEach(node => dict.set(node.id, node));
  return dict;
}

export namespace Graph {
  export interface Props {
    createFeatures: () => number[][][] | number[][];
    inputLegend: string[];
    graph: Model.Graph;
    graphActions: typeof GraphActions;
  }
  export interface State {
  }
}

// function findFirst(dict: Map<string, Model.Node>, start: Model.Node, predicate: (node: Model.Node) => boolean) {
//   const nodes = [start];
//   while (nodes.length > 0) {
//     const node = nodes.pop();
//     if (predicate(node)) return node;
//     nodes.push(...node.outputs.map(output => dict.get(output)));
//   }
//   return undefined;
// }

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

const checkBox = (label: string, options: string[], value: number, onUpdate: (value: string) => void) => (
  <div className="form-group">
    <label htmlFor={`${label}Select`}>{label}</label>
    <select className="form-control" value={value} id={`${label}Select`} onChange={e => onUpdate(e.target.value)}>
      {options.map((v, i) =>
        <option key={i}>{v}</option>)}
    </select>
  </div>
);

const inputGroup = (label: string, value: string, onUpdate: (value: string) => void) => (
  <div className="form-group">
    <label htmlFor={`${label}Input`}>{label}</label>
    <input type="text" className="form-control" id={`${label}Input`}
      placeholder={label} value={value} onChange={e => onUpdate(e.target.value)} />
  </div>
);

const numberGroup = (label: string, value: number, step: number, onUpdate: (value: number) => void) => (
  <div className="form-group">
    <label htmlFor={`${label}Input`}>{label}</label>
    <input type="number" className="form-control" id={`${label}Input`} step={step}
      placeholder={label} value={value} onChange={e => onUpdate(parseFloat(e.target.value))} />
  </div>
);

type UpdateConfig = (nodeId: string, nodeType: Model.Node['type'], property: string, value: string | number) => void;

export class Graph extends React.Component<Graph.Props, Graph.State> {
  // private model: tf.Model;

  constructor(props?: Graph.Props, context?: any) {
    super(props, context);
    // this.model = props.graph.input ? createModel(props.graph) : undefined;
  }

  private resolver(dict: Map<string, Model.Node>, updateConfig: UpdateConfig, flowNode: { payload: { node: Model.Node } }): JSX.Element {
    const { createFeatures, graph, inputLegend } = this.props;
    const { node } = flowNode.payload;
    const blank = <span>No Tensor data available</span>;
    if (node.id === 'input') {
      const features = createFeatures();
      return <Tensor width={200} height={200} legend={inputLegend} features={features} />;
    }
    else if (node.type === 'variable') {
      const tensor = node.content ? <Tensor width={200} height={200} features={{ array: node.content, shape: node.shape }} /> : blank;

      const config = () => {
        if (node.init === 'normal')
          return <ul>
            <li>{checkBox('distribution', ['normal', 'uniform', 'zero'], 0, updateConfig.bind(this, node.id, node.type, 'distribution'))}</li>
            <li>{inputGroup('shape', node.shape.join(' x '), updateConfig.bind(this, node.id, node.type, 'shape'))}</li>
            <li>{numberGroup('mean', node.mean, 0.01, updateConfig.bind(this, node.id, node.type, 'mean'))}</li>
            <li>{numberGroup('stdDev', node.stdDev, 0.01, updateConfig.bind(this, node.id, node.type, 'stdDev'))}</li>
          </ul >;
        else if (node.init === 'uniform')
          return <ul>
            <li>{checkBox('distribution', ['normal', 'uniform', 'zero'], 1, updateConfig.bind(this, node.id, node.type, 'distribution'))}</li>
            <li>{inputGroup('shape', node.shape.join(' x '), updateConfig.bind(this, node.id, node.type, 'shape'))}</li>
            <li>{numberGroup('min', node.min, 0.01, updateConfig.bind(this, node.id, node.type, 'min'))}</li>
            <li>{numberGroup('max', node.max, 0.01, updateConfig.bind(this, node.id, node.type, 'max'))}</li>
          </ul>;
        else if (node.init === 'zero')
          return <ul>
            <li>{checkBox('distribution', ['normal', 'uniform', 'zero'], 2, updateConfig.bind(this, node.id, node.type, 'distribution'))}</li>
            <li>{inputGroup('shape', node.shape.join(' x '), updateConfig.bind(this, node.id, node.type, 'shape'))}</li>
          </ul>;
      };

      return <div className={`${node.type} ${node.init}`}>
        <Tabs>
          <TabList>
            <Tab>Weights</Tab>
            <Tab>Config</Tab>
          </TabList>
          <TabPanel>
            {tensor}
          </TabPanel>
          <TabPanel className="node-config">
            <h2>{node.type}</h2>
            {config()}
          </TabPanel>
        </Tabs>
      </div>;
    }
    else {
      // Operators
      const { activations } = (node as Model.Output | Model.Add | Model.MatMul);
      const tensor = activations ? <Tensor height={200} width={200} features={{ shape: activations.shape, array: activations.values }} /> : blank;
      if (node.id === 'output' || node.type === 'mat-mul' || node.type === 'add' || node.type === 'relu') {
        // Operators without config
        return (
          <div className={node.type}>
            {tensor}
          </div>
        );
      }
      else {
        // Operators with config
        const config = () => {
          if (node.type === 'convolution') {
            return (
              <ul>
                <li>{numberGroup('filters', node.filters, 1, updateConfig.bind(this, node.id, node.type, 'filters'))}</li>
                <li>{numberGroup('strides', node.strides, 1, updateConfig.bind(this, node.id, node.type, 'strides'))}</li>
                <li>{numberGroup('depth', node.depth, 1, updateConfig.bind(this, node.id, node.type, 'depth'))}</li>
              </ul>
            );
          }
          else if (node.type === 'max-pool') {
            let filterGroup;
            if (typeof node.filterSize === 'number')
              filterGroup = numberGroup('filterSize', node.filterSize, 1, updateConfig.bind(this, node.id, node.type, 'filterSize'));
            else
              filterGroup = inputGroup('filterSize', node.filterSize.join(' x '), updateConfig.bind(this, node.id, node.type, 'filterSize'));
            return (
              <ul>
                <li>{filterGroup}</li>
                <li>{numberGroup('strides', node.strides, 1, updateConfig.bind(this, node.id, node.type, 'strides'))}</li>
                <li>{numberGroup('padding', node.pad, 1, updateConfig.bind(this, node.id, node.type, 'padding'))}</li>
              </ul>
            );
          }
          else if (node.type === 'reshape') {
            return (
              <ul>
                <li>{inputGroup('shape', node.shape.join(' x '), updateConfig.bind(this, node.id, node.type, 'shape'))}</li>
              </ul>
            );
          }
        };
        return <div className={`${node.type}`}>
          <Tabs>
            <TabList>
              <Tab>Weights</Tab>
              <Tab>Config</Tab>
            </TabList>
            <TabPanel>
              {tensor}
            </TabPanel>
            <TabPanel className="node-config">
              <h2>{node.type}</h2>
              {config()}
            </TabPanel>
          </Tabs>
        </div>;
      }
    }
  }

  private onGraphChanged(action: ChangeAction, updateProps: () => void) {
    if (action.type === 'ConnectionRemoved') {
      // TODO
    } else if (action.type === 'ConnectionCreated') {
      // TODO
    } else if (action.type === 'NodeRemoved') {
      // TODO
    } else if (action.type === 'NodeCreated') {
      // TODO
    }
    else if (action.type === 'NodeCollapseChanged') {
      updateProps();
    }
  }

  render(): JSX.Element {
    const { graph } = this.props;
    // loadWeightsFromGraph(graph, this.model);
    const dict = createDict(graph);

    const nodes: Node[] = [];

    // TODO: Find better location of that
    const positioning = new Map<string, Vector2d>();
    positioning.set('input', { x: 50, y: 100 });
    positioning.set('conv2d-1-weights', { x: 50, y: 200 });
    positioning.set('conv2d-1', { x: 400, y: 100 });
    positioning.set('relu-1', { x: 700, y: 100 });
    positioning.set('max-pool-1', { x: 1000, y: 100 });

    positioning.set('conv2d-2-weights', { x: 50, y: 400 });
    positioning.set('conv2d-2', { x: 400, y: 300 });
    positioning.set('relu-2', { x: 700, y: 300 });
    positioning.set('max-pool-2', { x: 1000, y: 300 });

    positioning.set('reshape-3', { x: 400, y: 500 });
    positioning.set('mat-mul-3', { x: 700, y: 500 });
    positioning.set('add-3', { x: 1000, y: 500 });
    positioning.set('output', { x: 1200, y: 500 });

    positioning.set('mat-mul-3-weight', { x: 400, y: 700 });
    positioning.set('add-3-weights', { x: 700, y: 700 });

    traverseGraphBackwards(graph, node => {
      const id = `${node.name}.${node.id}`;
      const createId = (n: Model.Node) => `${n.name}.${n.id}`;
      const inputs = node['inputs'] !== undefined ? _.toPairs((node as Model.OperationNode).inputs).map(([inputName, inputNode]) => ({ connection: [{ nodeId: createId(dict.get(inputNode)), port: 0 }], name: inputName })) : [];
      const outputs = node.outputs.filter(o => o !== 'result').map((o, i) => ({ connection: [{ nodeId: createId(dict.get(o)), port: i }], name: 'output' }));
      const position = positioning.get(node.id) || { x: 0, y: 0 };
      nodes.push({
        id,
        properties: { display: 'only-dots' },
        classNames: [node.type],
        name: node.name,
        payload: { node },
        type: node.type,
        inputs,
        outputs,
        position
      });
    });

    const updateConfig: UpdateConfig = (nodeId: string, nodeType: Model.Node['type'], property: string, value: string | number) => {
      this.props.graphActions.updateGraphNode({ nodeId, newValue: value, nodeType, propertyName: property });
    };

    const graphConfig: Config = {
      resolver: this.resolver.bind(this, dict, updateConfig),
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