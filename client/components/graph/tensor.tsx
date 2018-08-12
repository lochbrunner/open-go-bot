import * as React from "react";
import * as _ from 'lodash';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export namespace Tensor {
  export interface Props {
    features: number[][][] | { shape: number[], array: number[] };
    width: number;
    height: number;
    legend?: string[];

    position: { top: number, left: number };
  }
  export interface State {
    selection: number;
  }
}

function getRank(tensor: number | number[] | number[][] | number[][][] | number[][][][]): number[] {
  let rank = [];
  let testee = tensor;
  while (testee instanceof Array) {
    rank.push(testee.length);
    if (testee.length > 0)
      testee = testee[0];
    else
      break;
  }
  return rank;
}

function concateArrays<T>(a: T[], b: T[]): T[] {
  if (!(a instanceof Array))
    return b;
  if (!(b instanceof Array))
    return a;
  return b.push.apply(b, a);
}

function createDimension(array: number[], length: number) {
  const result = [] as number[][];
  for (let i = 0; i < array.length; i += length) {
    result.push(array.slice(i, i + length));
  }
  return result;
}

export class Tensor extends React.Component<Tensor.Props, Tensor.State> {
  constructor(props?: Tensor.Props, context?: any) {
    super(props, context);

    this.state = {
      selection: 0
    };

    this.onSelectionChanged = this.onSelectionChanged.bind(this);
  }

  private static calcColor(value: number, min: number, max: number) {
    if (min === max)
      return `rgb(127,165,127)`;
    const norm = (value - min) / (max - min);// Math.min(255, Math.max(0, value));
    const v = Math.floor(180 + 180 * norm);
    return `hsl(${v}, ${80}%, ${50}%)`;
  }

  private onSelectionChanged(e: number) {
    this.setState((prev, props) => {
      return { ...prev, selection: e };
    });
  }

  render(): JSX.Element {
    const { width, height, features, legend, position } = this.props;
    const { selection } = this.state;
    const [rows, columns, channels] = features instanceof Array ? getRank(features) : features.shape;
    const flatFeatures = features instanceof Array ? _.flatten(features) : createDimension(features.array, 9);
    const dx = (width - 1) / rows;
    const dy = (height - 1) / columns;
    const lineStyle = {
      stroke: 'rgb(0,0,0)',
      strokeWidth: 1
    };
    // Lines
    const linesH = _.range(0, columns + 1).map(i => {
      return <line key={i + 1000} x1={0} y1={Math.floor(i * dy) + 0.5} x2={width} y2={Math.floor(i * dy) + 0.5} style={lineStyle} />;
    });

    const linesW = _.range(0, rows + 1).map(i => {
      return <line key={i + 2000} y1={0} x1={Math.floor(i * dx) + 0.5} y2={height} x2={Math.floor(i * dx) + 0.5} style={lineStyle} />;
    });

    const [min, max] = flatFeatures.reduce((p, s) => [Math.min(p[0], s[selection]), Math.max(p[1], s[selection])], [Number.MAX_VALUE, Number.MIN_VALUE]);

    const featuresField = flatFeatures.map((feature, i) => {
      const x = i % rows;
      const y = Math.floor(i / rows);
      return <rect key={i} x={x * dx} y={y * dy} width={dx} height={dy} fill={Tensor.calcColor(feature[selection], min, max)} >
        <title>{feature[selection]}</title>
      </rect>;
    });

    const marks = legend ? _.fromPairs(legend.map((key, i) => [i, key])) : _.times(channels).map((v, i) => i.toString());

    return <div style={{ position: 'absolute', top: position.top, left: position.left }}>
      <svg style={{ float: 'left' }} width={width} height={height} >
        {linesH}
        {linesW}
        {featuresField}
      </svg>
      <Slider style={{ height, float: 'left', marginLeft: '10px' }} min={0} max={8} marks={marks} step={1} included={false} onChange={this.onSelectionChanged} defaultValue={0} vertical />
    </div>;
  }
}