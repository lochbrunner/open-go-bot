import React = require("react");
import { sizeFromShape } from "@tensorflow/tfjs-core/dist/util";
import _ = require("lodash");

export interface Size {
    width: number;
    height: number;
}

function equalSize(a: Size, b: Size) {
    return a.height === b.height && a.width === b.width;
}

function equalMatrix(a: number[][], b: number[][]) {
    if (a.length !== b.length)
        return false;

    for (let y in a) {
        if (a[y].length !== b[y].length)
            return false;
        for (let x in a[0]) {
            if (a[y][x] !== b[y][x])
                return false;
        }
    }

    return true;
}

const copy2d = source => source.map(arr => {
    return arr.slice();
});

export interface Props {
    size: Size;
    resolution: Size;
    pixels: number[][];
    update: (payload: { x: number, y: number, value: number }) => void;
}

interface Cache {
    size: Size;
    resolution: Size;
    pixels: number[][];
}

export class ImageEditor extends React.Component<Props, {}> {
    cache: Cache;
    constructor(props: Props) {
        super(props);
        this.cache = {
            pixels: [],
            resolution: { height: 0, width: 0 },
            size: { height: 0, width: 0 }
        };
    }

    private draw(element: HTMLCanvasElement) {
        if (element === null) return;
        const { cache, props, state } = this;
        if (!equalSize(cache.resolution, props.resolution) ||
            !equalSize(cache.size, props.size) ||
            !equalMatrix(cache.pixels, props.pixels)) {
            const marginX = 2;
            const marginY = 2;

            const ctx = element.getContext('2d');
            ctx.clearRect(0, 0, props.size.width, props.size.height);
            const dx = (props.size.width - marginX * 2) / props.resolution.width;
            const dy = (props.size.height - marginY * 2) / props.resolution.height;

            for (let x = 0; x < props.resolution.width; ++x) {
                for (let y = 0; y < props.resolution.height; ++y) {
                    const value = Math.floor((1 - props.pixels[x][y]) * 225 + 30).toString(16);
                    ctx.fillStyle = `#${value}${value}${value}`;
                    const sx = marginX + 0.5 + Math.floor(dx * x);
                    const sy = marginY + 0.5 + Math.floor(dy * y);
                    ctx.fillRect(sx, sy, dx, dy);
                }
            }
            for (let x = 0; x < props.resolution.width + 1; ++x) {
                ctx.moveTo(marginX + 0.5 + Math.floor(dx * x), marginY);
                ctx.lineTo(marginX + 0.5 + Math.floor(dx * x), props.size.height - marginY);
            }
            for (let y = 0; y < props.resolution.height + 1; ++y) {
                ctx.moveTo(marginX, marginY + 0.5 + Math.floor(dy * y));
                ctx.lineTo(props.size.width - marginX, marginY + 0.5 + Math.floor(dy * y));
            }

            ctx.lineWidth = 0.2;
            ctx.strokeStyle = '#000000';
            ctx.stroke();
            this.cache.pixels = copy2d(props.pixels);
            this.cache.resolution = props.resolution;
            this.cache.size = props.size;
        }
    }

    private onMouseMove(e: MouseEvent) {
        const { state, props } = this;
        const marginX = 2;
        const marginY = 2;
        const dx = (props.size.width - marginX * 2) / props.resolution.width;
        const dy = (props.size.height - marginY * 2) / props.resolution.height;

        const top = (e.currentTarget as HTMLCanvasElement).offsetTop;
        const left = (e.currentTarget as HTMLCanvasElement).offsetLeft;

        const leftDown = (e.buttons & 1) > 0;
        const middleDown = (e.buttons & 4) > 0;
        if (!leftDown && !middleDown) {
            return;
        }
        const x = Math.floor((e.clientX - marginX - left) / dx);
        const y = Math.floor((e.clientY - marginY - top) / dy);
        if (x < 0 || x >= props.resolution.width || y < 0 || y >= props.resolution.height) return;
        const value = leftDown ? 1 : 0;
        // console.log(`Mouse at ${x}x${y} left: ${leftDown} middle: ${middleDown}`);
        if (this.props.pixels[x][y] !== value) {
            this.props.update({ x, y, value });
        }
        // e.cancelBubexpectble = true;
    }

    render() {
        const { props } = this;
        return (
            <canvas
                width={props.size.width}
                height={props.size.height}
                ref={this.draw.bind(this)}
                onMouseMove={this.onMouseMove.bind(this)} />
        );
    }
}