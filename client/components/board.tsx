import * as React from 'react';
import * as _ from 'lodash';
import * as gameActions from '../actions/game';

export namespace Board {
  export interface Props {
    game: Game;
    disabled: boolean;

    displaySettings: DisplaySettings;

    gameActions: typeof gameActions;
  }

  export interface State {
  }
}

namespace BoardHover {
  export interface Props {
    physicalSize: { width: number, height: number };
    game: Game;

    gameActions: typeof gameActions;
  }

  export interface State {
    x: number;
    y: number;
  }
}

class BoardHover extends React.Component<BoardHover.Props, BoardHover.State>{
  constructor(props?: BoardHover.Props, context?: any) {
    super(props, context);
    this.onMouseMove = this.onMouseMove.bind(this);

    this.onClick = this.onClick.bind(this);
  }

  private onClick(event: any) {
    const e = event as React.MouseEvent<HTMLButtonElement>;
    this.props.gameActions.setStone({
      player: this.props.game.turn,
      pos: this.state
    });
  }

  componentWillMount() {
    this.state = { x: 0, y: 0 };
  }

  onMouseMove(event: any) {

    const d = this.props.physicalSize.width / (2 + this.props.game.info.size);
    const padding = d * 1.5;

    const e = event as MouseEvent;
    const m = this.refs['main'] as any;
    const r = m.getBoundingClientRect() as ClientRect;
    const x = Math.floor((e.clientX - r.left - d) / d);
    const y = Math.floor((e.clientY - r.top - d) / d);

    if (x !== this.state.x || y !== this.state.y) {
      this.setState({ x, y });
    }
  }

  render(): JSX.Element {

    const { x, y } = this.state;

    const blackColor = 'rgba(0,0,0,0.5)';
    const whiteColor = 'rgba(255,255,255, 0.5)';

    const { physicalSize, game } = this.props;
    const { turn } = game;
    const color = turn === 'white' ? whiteColor : blackColor;

    const d = physicalSize.width / (2 + game.info.size);
    const padding = d * 1.5;
    const radius = d / 2 / 1.1;
    const { size } = game.info;

    if (x > -1 && x < size && y > -1 && y < size && !game.field[x + y * size].forbidden)
      return (
        <g onClick={this.onClick} onMouseMove={this.onMouseMove} ref='main'>
          <rect x='0' y='0' width={this.props.physicalSize.width} height={this.props.physicalSize.height} strokeWidth='0' fill='rgba(0,0,0,0.0)' />
          <circle r={radius} cx={padding + x * d} cy={padding + y * d} stroke={'rgba(0,0,0,0.5)'} strokeWidth='2' fill={color} />;
                </g>
      );

    return (
      <g onClick={() => { }} onMouseMove={this.onMouseMove} ref='main'>
        <rect x='0' y='0' width={this.props.physicalSize.width} height={this.props.physicalSize.height} strokeWidth='0' fill='rgba(0,0,0,0.0)' />
      </g>
    );
  }
}

export class Board extends React.Component<Board.Props, Board.State>{

  constructor(props?: Board.Props, context?: any) {
    super(props, context);
  }

  render() {
    // Styles
    const lineStyle = {
      stroke: 'rgb(120,120,120)',
      strokeWidth: 2
    };

    const textStyle = {
      fontFamily: 'sans-serif'
    };

    const componentStyle = {
      display: 'inline-block'
    };

    const greenTextStyle = {
      fontFamily: "sans-serif",
      fill: "rgb(0,192, 0)"
    };

    const { game, displaySettings } = this.props;
    const { size } = game.info;

    const legendNumbers = _.range(1, size + 1);
    const legendLetters = _.range(1, size + 1).map(i => String.fromCharCode(i > 8 ? i + 65 : i + 64)); // Remove 'I'

    const boardWidth = 630;
    const boardHeight = 630;

    const d = boardWidth / (2 + size);
    const padding = d * 1.5;
    const radius = d / 2 / 1.1;

    // Lines
    const linesH = legendLetters.map((c, i) => {
      return <line key={i + 1000} x1={padding} y1={padding + i * d} x2={boardWidth - padding} y2={padding + i * d} style={lineStyle} />;
    });

    const linesW = legendNumbers.map((n, i) => {
      return <line key={i + 2000} y1={padding} x1={padding + i * d} y2={boardHeight - padding} x2={padding + i * d} style={lineStyle} />;
    });

    // Board Marks
    let markCoords = [];
    if (size === 19) {
      // Draw marks at 3, 9 and 15
      markCoords = [3, 9, 15];
    }
    const marks = _.flatten(markCoords.map(x => markCoords.map(y => <circle key={x + y * 19 + 3000} r={radius / 3.2} cx={padding + x * d} cy={padding + y * d} fill='rgb(60,60,60)' />)));

    // Legend
    const textLeft = legendNumbers.map((n, i) => {
      return <text key={i + 4000} x='7' y={boardHeight - padding - d * i + 5} textAnchor='middle' style={textStyle}>{n}</text>;
    });
    const textRight = legendNumbers.map((n, i) => {
      return <text key={i + 5000} x={boardWidth - 15} y={boardHeight - padding - d * i + 5} textAnchor='middle' style={textStyle}>{n}</text>;
    });

    const textTop = legendLetters.map((c, i) => {
      return <text key={i + 6000} y='20' x={padding + i * d} textAnchor='middle' style={textStyle} >{c}</text>;
    });

    const textBottom = legendLetters.map((c, i) => {
      return <text key={i + 7000} y={boardHeight - 5} x={padding + i * d} textAnchor='middle' style={textStyle} >{c}</text>;
    });

    const whiteStonePositions = game.field.map((v, i) => {
      if (v.stone === 'white')
        return i;
    }).filter(isFinite);

    const blackStonePositions = game.field.map((v, i) => {
      if (v.stone === 'black')
        return i;
    }).filter(isFinite);

    const whitheStones = whiteStonePositions.map(i => {
      const x = i % size;
      const y = Math.floor(i / size);
      return <circle key={i + 8000} r={radius} cx={padding + x * d} cy={padding + y * d} stroke='rgb(0,0,0)' strokeWidth='2' fill='rgba(255,255,255,0.9)' />;
    });

    const blackStones = blackStonePositions.map(i => {
      const x = i % size;
      const y = Math.floor(i / size);
      return <circle key={i + 9000} r={radius} cx={padding + x * d} cy={padding + y * d} stroke='rgb(0,0,0)' strokeWidth='2' fill='rgba(0,0,0,0.9)' />;
    });

    const lastMove = game.lastMove ? <circle key={game.lastMove.x + game.lastMove.y * 19 + 3000} r={radius / 1.8} cx={padding + game.lastMove.x * d} cy={padding + game.lastMove.y * d} stroke='rgba(127,127,127, 1.0)' strokeWidth='3' fill='rgba(127,127,127, 0.0)' /> : '';

    const liberties = [];
    if ((displaySettings as any).get('showLiberties')) {
      const whiteStoneLiberties = game.field.forEach((v, i) => {
        if (v.stone !== 'empty') {
          const x = i % size;
          const y = Math.floor(i / size);
          liberties.push(<text key={i + 10000} x={padding + x * d} y={padding + 5 + y * d} textAnchor="middle" style={greenTextStyle} >{v.liberties}</text>);
        }
      });
    }

    const libertyCells = [];
    if ((displaySettings as any).get('showIsLiberty')) {
      const whiteStoneLiberties = game.field.forEach((v, i) => {
        if (v.isLiberty) {
          const x = i % size;
          const y = Math.floor(i / size);
          liberties.push(<rect key={i + 11000} x={padding + x * d - d / 2} y={padding + y * d - d / 2} width={d} height={d} fill={'rgba(64,255,64,0.4)'} />);
        }
      });
    }
    const libCells = [];
    if ((displaySettings as any).get('showIsLiberty')) {
      const whiteStoneLiberties = game.field.forEach((v, i) => {
        if (v.occupiedAdjacentCells) {
          const x = i % size;
          const y = Math.floor(i / size);
          libCells.push(<text key={i + 12000} x={padding + x * d} y={padding + 5 + y * d} textAnchor="middle" style={greenTextStyle} >{v.occupiedAdjacentCells}</text>);
        }
      });
    }

    const forbiddenCells = [];
    const rectSize = 0.6;
    if ((displaySettings as any).get('showForbidden')) {
      const whiteStoneLiberties = game.field.forEach((v, i) => {
        if (v.isLiberty && v.forbidden === game.turn) {
          const x = i % size;
          const y = Math.floor(i / size);
          liberties.push(<rect key={i + 13000} x={d * (1.0 - rectSize) / 2.0 + padding + x * d - d / 2} y={d * (1.0 - rectSize) / 2.0 + padding + y * d - d / 2} width={d * rectSize} height={d * rectSize} stroke='rgb(0,0,0)' strokeWidth='3' fill='rgba(0,0,0,0)' />);
        }
      });
    }

    const hover = this.props.disabled ?
      '' : <BoardHover gameActions={this.props.gameActions} game={this.props.game} physicalSize={{ width: boardWidth, height: boardHeight }} />;

    return (
      <div style={componentStyle}>
        <svg width={boardWidth} height={boardHeight}>
          {libertyCells}
          {linesH}
          {linesW}
          {marks}
          {textLeft}
          {textRight}
          {textTop}
          {textBottom}
          {blackStones}
          {whitheStones}
          {lastMove}
          {liberties}
          {libCells}
          {forbiddenCells}
          {hover}
        </svg>
      </div>
    );
  }
}