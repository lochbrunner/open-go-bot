import * as React from "react";
import * as _ from 'lodash';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import "react-tabs/style/react-tabs.css";

import { Editor, Node, Config, ChangeAction } from 'react-flow-editor';
import { Port } from "react-flow-editor/dist/types";

import { Tensor } from './tensor';
import * as GraphActions from '../../actions/graph';

import './index.scss';
import { createDictFromGraph } from "../../utilities/toolbox";

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

function traverseGraphBackwards(graph: Model.Graph, callback: (node: Model.NodeContainer) => void) {
  if (graph === undefined)
    return;
  const dict = createDictFromGraph(graph);
  // Add an unique index to each
  const queue: Model.NodeContainer[] = [graph.nodes.find(n => n.node.type === 'output')];
  while (queue.length > 0) {
    const container = queue.shift();
    if (container === undefined) break;
    if (container.node['inputs'] !== undefined) {

      queue.push(..._.values(container.node['inputs']).map(input => dict.get(input)));
    }
    callback(container);
  }
}

const checkBox = (label: string, options: string[], value: string, onUpdate: (value: string) => void) => (
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

  constructor(props?: Graph.Props, context?: any) {
    super(props, context);
  }

  private resolver(dict: Map<string, Model.Node>, updateConfig: UpdateConfig, flowNode: { payload: { node: Model.NodeContainer } }): JSX.Element {
    const { createFeatures, graph, inputLegend } = this.props;
    const { node } = flowNode.payload.node;
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
            <li>{checkBox('distribution', ['normal', 'uniform', 'zero'], 'normal', updateConfig.bind(this, node.id, node.type, 'init'))}</li>
            <li>{inputGroup('shape', node.shape.join(' x '), updateConfig.bind(this, node.id, node.type, 'shape'))}</li>
            <li>{numberGroup('mean', node.mean, 0.01, updateConfig.bind(this, node.id, node.type, 'mean'))}</li>
            <li>{numberGroup('stdDev', node.stdDev, 0.01, updateConfig.bind(this, node.id, node.type, 'stdDev'))}</li>
          </ul >;
        else if (node.init === 'uniform')
          return <ul>
            <li>{checkBox('distribution', ['normal', 'uniform', 'zero'], 'uniform', updateConfig.bind(this, node.id, node.type, 'init'))}</li>
            <li>{inputGroup('shape', node.shape.join(' x '), updateConfig.bind(this, node.id, node.type, 'shape'))}</li>
            <li>{numberGroup('min', node.min, 0.01, updateConfig.bind(this, node.id, node.type, 'min'))}</li>
            <li>{numberGroup('max', node.max, 0.01, updateConfig.bind(this, node.id, node.type, 'max'))}</li>
          </ul>;
        else if (node.init === 'zero')
          return <ul>
            <li>{checkBox('distribution', ['normal', 'uniform', 'zero'], 'zero', updateConfig.bind(this, node.id, node.type, 'init'))}</li>
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
                <li>{checkBox('padding', ['same', 'valid'], node.padding, updateConfig.bind(this, node.id, node.type, 'padding'))}</li>
                <li>{numberGroup('rank', node.rank, 1, updateConfig.bind(this, node.id, node.type, 'rank'))}</li>
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
    const dict = createDictFromGraph(graph);

    const nodes: Node[] = [];

    traverseGraphBackwards(graph, c => {
      const id = `${c.node.name}.${c.node.id}`;
      const createId = (n: Model.Node) => `${n.name}.${n.id}`;
      const connectionLabel = (name: string, connections: Map<string, Model.ConnectionConstraints>) => `${name} ${connections.has(name) ? connections.get(name).shape.map(d => d === undefined ? '?' : d.toString()).join('x') : ''}`;
      const inputs = c.node['inputs'] !== undefined ?
        _.toPairs((c.node as Model.OperationNode).inputs)
          .map(([inputName, inputNode]): Port => ({
            connection: [{
              nodeId: createId(dict.get(inputNode).node),
              port: 0,
              classNames: [c.connections.inputs.has(inputName) ? c.connections.inputs.get(inputName).valid.state : 'invalid'],
              notes: c.connections.inputs.has(inputName) ? c.connections.inputs.get(inputName).valid['reason'] : 'Not found'
            }],
            name: connectionLabel(inputName, c.connections.inputs)
          })) : [];
      const outputs: Node['outputs'] = c.node.outputs
        .filter(o => o !== 'result')
        .map((o, i): Port => ({
          connection: [{
            nodeId: createId(dict.get(o).node),
            port: i,
            classNames: [c.connections.outputs.get('output').valid.state],
            notes: c.connections.outputs.get('output').valid['reason']
          }],
          name: connectionLabel('output', c.connections ? c.connections.outputs : new Map())
        }));

      nodes.push({
        id,
        properties: { display: 'only-dots' },
        classNames: [c.node.type],
        name: c.node.name,
        payload: { node: c },
        type: c.node.type,
        inputs,
        outputs,
        position: c.position
      });
    });

    const updateConfig: UpdateConfig = (nodeId: string, nodeType: Model.Node['type'], property: string, value: string | number) => {
      this.props.graphActions.checkUpdateGraphNode({ nodeId, newValue: value, nodeType, propertyName: property }, graph, dict);
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