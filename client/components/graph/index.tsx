import * as React from "react";
import * as _ from 'lodash';
import * as encoder from '../../utilities/encoder';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

import { Tensor } from './tensor';

export namespace Graph {
  export interface Props {
    game: Game;
  }
  export interface State {
  }
}

export class Graph extends React.Component<Graph.Props, Graph.State> {
  constructor(props?: Graph.Props, context?: any) {
    super(props, context);
  }

  render(): JSX.Element {
    const { game } = this.props;
    const features = encoder.createFeatures(game);
    return <div>
      <Tensor width={300} height={300} legend={encoder.legend} features={features} dimension={{ height: game.info.size, width: game.info.size }} />
    </div>;
  }
}