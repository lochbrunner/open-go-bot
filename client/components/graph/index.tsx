import * as React from "react";
import * as _ from 'lodash';
import * as encoder from '../../ai/encoder';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export namespace Graph {
  export interface Props {
    game: Game;
    width: number;
    height: number;
  }
  export interface State {
    selection: number;
  }
}

export class Graph extends React.Component<Graph.Props, Graph.State> {
  constructor(props?: Graph.Props, context?: any) {
    super(props, context);

    this.state = {
      selection: 0
    };

    this.onSelectionChanged = this.onSelectionChanged.bind(this);
  }

  private static calcColor(value: number) {
    const norm = Math.min(255, Math.max(0, value));
    const v = Math.floor(155 + 100 * norm);
    return `rgb(${v}, ${v}, ${v})`;
  }

  private onSelectionChanged(e: number) {
    this.setState((prev, props) => {
      prev.selection = e;
      return prev;
    });
  }

  render(): JSX.Element {
    const { width, height, game } = this.props;
    const { size } = game.info;
    const { selection } = this.state;

    const dx = (width - 1) / size;
    const dy = (height - 1) / size;
    const lineStyle = {
      stroke: 'rgb(0,0,0)',
      strokeWidth: 1
    };
    // Lines
    const linesH = _.range(0, size + 1).map(i => {
      return <line key={i + 1000} x1={0} y1={Math.floor(i * dy) + 0.5} x2={width} y2={Math.floor(i * dy) + 0.5} style={lineStyle} />;
    });

    const linesW = _.range(0, size + 1).map(i => {
      return <line key={i + 2000} y1={0} x1={Math.floor(i * dx) + 0.5} y2={height} x2={Math.floor(i * dx) + 0.5} style={lineStyle} />;
    });

    const features = encoder.createFeatures(game);

    const keys = _.keys(features[0]);

    const featuresField = features.map((feature, i) => {
      const x = i % size;
      const y = Math.floor(i / size);
      return <rect key={i} x={x * dx} y={y * dy} width={dx} height={dy} fill={Graph.calcColor(feature[keys[selection]])} />;
    });

    const marks = _.fromPairs(keys.map((key, i) => [i, key]));

    return <div>
      <svg style={{ float: 'left' }} width={width} height={height} >
        {linesH}
        {linesW}
        {featuresField}
      </svg>
      <Slider style={{ height, float: 'left', marginLeft: '10px' }} min={0} max={8} marks={marks} step={1} included={false} onChange={this.onSelectionChanged} defaultValue={0} vertical />
    </div>;
  }
}