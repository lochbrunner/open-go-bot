import * as React from "react";
import * as _ from 'lodash';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import './tensor.scss';

export namespace Tensor {
  export interface Props {
    features: number[][][] | { shape: number[], array: number[] };
    width: number;
    height: number;
    legend?: string[];
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

function comapareArrays(a: number[], b: number[]): boolean {
  if (a === undefined || b === undefined) return false;
  if (a.length !== b.length) return false;
  for (let i in a) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function createDimension(array: number[], length: number) {
  const result = [] as number[][];
  for (let i = 0; i < array.length; i += length) {
    result.push(array.slice(i, i + length));
  }
  return result;
}

export class Tensor extends React.Component<Tensor.Props, Tensor.State> {

  private lastRenderedData?: number[];

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
    const v = Math.floor(260 + 100 * norm);
    return `hsl(${v}, ${70}%, ${60}%)`;
  }

  private onSelectionChanged(e: number) {
    this.setState(prev => {
      return { ...prev, selection: e };
    });
  }

  render(): JSX.Element {
    const { width, height, features, legend } = this.props;
    const { selection } = this.state;
    const [rows, columns, channels] = features instanceof Array ? getRank(features) : features.shape;
    const flatFeatures = features instanceof Array ? _.flatten(features) : createDimension(features.array, channels);
    const dx = (width - 1) / rows;
    const dy = (height - 1) / columns;
    const [min, max] = flatFeatures.reduce((p, s) => [Math.min(p[0], s[selection]), Math.max(p[1], s[selection])], [Number.MAX_VALUE, Number.MIN_VALUE]);

    const marks = legend ? _.fromPairs(legend.map((key, i) => [i, key])) : _.times(channels).map((v, i) => i.toString());
    const slider = legend || channels > 1 ? <Slider style={{ height, float: 'left', marginLeft: '10px' }} min={0} max={8} marks={marks} step={1} included={false} onChange={this.onSelectionChanged} defaultValue={0} vertical /> : '';

    const fillCanvas = (element: HTMLCanvasElement) => {
      if (element === null) return;
      const selectedFeature = flatFeatures.map(feature => feature[selection]);
      if (comapareArrays(this.lastRenderedData, selectedFeature)) return;

      const ctx = element.getContext('2d');
      ctx.clearRect(0, 0, element.width, element.height);
      ctx.beginPath();
      ctx.strokeStyle = 'rgb(0,0,0)';
      for (let iy = 0; iy < rows + 1; ++iy) {
        const y = Math.floor(iy * dy) + 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      for (let ix = 0; ix < columns + 1; ++ix) {
        const x = Math.floor(ix * dx) + 0.5;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.stroke();
      // The features
      this.lastRenderedData = selectedFeature;

      for (let si in selectedFeature) {
        const i = parseInt(si);
        const feature = selectedFeature[i];
        const x = i % rows;
        const y = Math.floor(i / rows);
        ctx.beginPath();
        ctx.rect(x * dx, y * dy, dx, dy);
        ctx.fillStyle = Tensor.calcColor(feature, min, max);
        ctx.fill();
      }
    };

    return <div className="tensor" style={{ width: `${width + (slider ? 100 : 0)}px` }}>
      <canvas ref={fillCanvas} style={{ float: 'left' }} width={width} height={height} />
      {slider}
      <div className="legend" style={{ width: '100%', marginTop: `${slider ? 15 : 10}px` }}>
        <div className="range" >
          <span className="min label">{min.toPrecision(3)}</span>
          <span className="max label">{max.toPrecision(3)}</span>
        </div>
      </div>
    </div >;
  }
}