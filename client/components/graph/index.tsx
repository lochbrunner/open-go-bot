import * as React from "react";
import * as _ from 'lodash';
import * as encoder from '../../utilities/encoder';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

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
  constructor(props?: Graph.Props, context?: any) {
    super(props, context);
  }

  render(): JSX.Element {
    const { game, graph } = this.props;
    const features = encoder.createFeatures(game);

    // Find the correct conv node
    const convNode = findFirst(graph.input, node => node.type === 'convolution') as Model.Convolution;
    const convWeights = convNode.weights;

    return <div>
      <Tensor width={300} height={300} position={{ left: 0, top: 0 }} legend={encoder.legend} features={features} />
      <Tensor width={200} height={200} position={{ left: 0, top: 350 }} legend={encoder.legend} features={{ shape: [5, 5, 9], array: convNode.weights }} />
    </div>;
  }
}