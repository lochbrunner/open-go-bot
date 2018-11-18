import * as React from "react";
import * as _ from 'lodash';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import './tensor.scss';
import { shape } from "prop-types";

export namespace Tensor {
  export interface Props {
    features: number[][][] | number[][] | number[] | { shape: number[], array: number[] };
    width: number;
    height: number;
    legend?: string[];
  }
  export interface State {
    selection: number[];
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
      selection: [0, 0, 0, 0]
    };

    // this.onSelectionChanged = this.onSelectionChanged.bind(this);
  }

  private static calcColor(value: number, min: number, max: number) {
    if (min === max)
      return `rgb(127,165,127)`;
    const norm = (value - min) / (max - min);// Math.min(255, Math.max(0, value));
    const v = Math.floor(260 + 100 * norm);
    return `hsl(${v}, ${70}%, ${60}%)`;
  }

  private onSelectionChanged(id: number, e: number) {
    this.setState(prev => {
      const selection = [...prev.selection];
      selection[id] = e;
      return { ...prev, selection };
    });
  }

  render(): JSX.Element {
    const { width, height, features, legend } = this.props;
    const { selection } = this.state;
    const shape = features instanceof Array ? getRank(features) : features.shape;
    let [rows, columns, channels1, channels2] = shape.filter(s => s > 1);

    const pick = (full: number[], shape: number[], selection: number[][]): number[] => {
      const picked: number[] = [];
      if (shape.length === 4) {
        for (let x = selection[0][0]; x < selection[0][1]; ++x) {
          for (let y = selection[1][0]; y < selection[1][1]; ++y) {
            for (let z = selection[2][0]; z < selection[2][1]; ++z) {
              for (let u = selection[3][0]; u < selection[3][1]; ++u) {
                picked.push(full[x * shape[1] * shape[2] * shape[3] + y * shape[2] * shape[3] + z * shape[3] + u]);
              }
            }
          }
        }
      }
      else {
        // TODO
      }
      return picked;
    };

    let min: number;
    let max: number;
    let selectedFeature: number[];
    let slider: JSX.Element | JSX.Element[] = [];
    if (columns === undefined) {
      // Rank 1 tensor
      columns = 1;
      selectedFeature = features instanceof Array ? (features as number[]) : features.array;
    }
    else if (channels1 === undefined) {
      // Rank 2 tensor
      const flatFeatures = features instanceof Array ? _.flatten(features as number[][]) : features.array;

      selectedFeature = flatFeatures;
    }
    else if (channels2 === undefined) {
      // Rank 3 tensor
      const flatFeatures = features instanceof Array ? _.flatten(features as number[][][]) : createDimension(features.array, channels1);
      const marks = legend ? _.fromPairs(legend.map((key, i) => [i, key])) : _.times(channels1).map((v, i) => i.toString());
      slider = legend || channels1 > 1 ? <Slider
        style={{ height, float: 'left', marginLeft: '10px' }}
        min={0} max={channels1} step={1} included={false}
        onChange={this.onSelectionChanged.bind(this, 0)} defaultValue={0} vertical /> : [];
      selectedFeature = flatFeatures.map(feature => feature[selection[0]]);
    }
    else {
      // Rank 4 tensor
      if (features instanceof Array) {
        // TODO
      }
      else {
        const flatFeatures = features.array;
        selectedFeature = pick(flatFeatures, [rows, columns, channels1, channels2], [[0, rows], [0, columns], [selection[0], selection[0] + 1], [selection[1], selection[1] + 1]]);

        slider.push(<Slider style={{ height, float: 'left', marginLeft: '10px' }} min={0} max={channels1} step={1} defaultValue={0} onChange={this.onSelectionChanged.bind(this, 0)} vertical />);
        slider.push(<Slider style={{ height, float: 'left', marginLeft: '30px' }} min={0} max={channels2} step={1} defaultValue={0} onChange={this.onSelectionChanged.bind(this, 1)} vertical />);
      }
    }
    [min, max] = selectedFeature.reduce((p, s) => [Math.min(p[0], s), Math.max(p[1], s)], [Number.MAX_VALUE, Number.MIN_VALUE]);

    const dx = (width - 1) / rows;
    const dy = (height - 1) / columns;
    const fillCanvas = (element: HTMLCanvasElement) => {
      if (element === null) return;
      if (comapareArrays(this.lastRenderedData, selectedFeature)) return;

      const ctx = element.getContext('2d');
      ctx.clearRect(0, 0, element.width, element.height);
      ctx.beginPath();
      ctx.strokeStyle = 'rgb(0,0,0)';
      if (dy > 2) {
        for (let iy = 0; iy < rows + 1; ++iy) {
          const y = Math.floor(iy * dy) + 0.5;
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
      }
      if (dx > 2) {
        for (let ix = 0; ix < columns + 1; ++ix) {
          const x = Math.floor(ix * dx) + 0.5;
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
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