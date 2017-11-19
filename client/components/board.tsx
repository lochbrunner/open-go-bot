import * as React from 'react';
import * as _ from 'lodash';
import * as gameActions from '../actions/game';

interface Size2d {
    width: number;
    height: number;
}

export namespace Board {
    export interface Props {
        boardSize: Size2d;
        game: Game;

        gameActions: typeof gameActions;
    }

    export interface State {
    }
}

namespace BoardHover {
    export interface Props {
        physicalSize: Size2d;
        boardSize: Size2d;
        playersTurn: Player;

        gameActions: typeof gameActions;
    }

    export interface State {
        x: number;
        y: number;
    }
}

class BoardHover extends React.Component<BoardHover.Props, BoardHover.State>{
    constructor(props?: BoardHover.Props, context?: any){
        super(props, context);
        this.onMouseMove = this.onMouseMove.bind(this);

        this.onClick = this.onClick.bind(this); 
    }

    private onClick(event: any) {
        const e = event as React.MouseEvent<HTMLButtonElement>
        this.props.gameActions.setStone({
            fieldWidth: this.props.boardSize.width,
            player: this.props.playersTurn,
            pos: this.state
        });
    }

    componentWillMount(){
        this.state = {x:0, y:0};
    }

    onMouseMove(event: any){

        const d = this.props.physicalSize.width / (2 + this.props.boardSize.width);
        const padding = d*1.5;

        const e = event as MouseEvent;
        const m = this.refs["main"] as any;
        const r =  m.getBoundingClientRect() as ClientRect;
        const x = Math.floor((e.clientX-r.left-d) /d);
        const y = Math.floor((e.clientY-r.top-d) /d);

        if(x != this.state.x || y != this.state.y){
            this.setState({x,y})
        }
    }

    render() : JSX.Element{

        const x = this.state.x;
        const y = this.state.y;

        const blackColor = "rgba(0,0,0,0.5)";
        const whiteColor = "rgba(255,255,255, 0.5)";

        
        const {physicalSize, boardSize, playersTurn} = this.props;
        const color = playersTurn === 'white' ? whiteColor : blackColor;

        const d = physicalSize.width / (2 + boardSize.width);
        const padding = d*1.5;
        const radius = d / 2 / 1.1;

        let stone :JSX.Element = null;
        if(x>-1 && x<boardSize.width && y>-1 && y<boardSize.height)
            stone = <circle r={radius} cx={padding + x*d} cy={padding + y*d} stroke={'rgba(0,0,0,0.5)'} strokeWidth="2" fill={color}/>;

        return (
            <g onClick={this.onClick} onMouseMove={this.onMouseMove} ref="main">
                <rect x="0" y="0" width={this.props.physicalSize.width} height={this.props.physicalSize.height} strokeWidth="0" fill="rgba(0,0,0,0.0)" />
                {stone}
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
            stroke: "rgb(120,120,120)",
            strokeWidth: 2
        }

        const textStyle = {
            fontFamily: "sans-serif"
        }

        const {boardSize} = this.props;
        const {width, height} = boardSize;

        const legendNumbers = _.range(1, height+1);
        const legendLetters = _.range(1, width+1).map(i => String.fromCharCode(i > 8 ? i + 65 : i + 64)); // Remove 'I'

        const boardWidth = 630;
        const boardHeight = 630;


        const d = boardWidth / (2 + width);
        const padding = d*1.5;
        const radius = d / 2 / 1.1;

        // Lines
        const linesH = legendLetters.map((c, i)=>{
            return <line key={i} x1={padding} y1={padding+i*d} x2={boardWidth-padding} y2={padding+i*d} style={lineStyle}/>
        });
        
        const linesW = legendNumbers.map((n, i)=>{
            return <line key={i} y1={padding} x1={padding+i*d} y2={boardHeight - padding} x2={padding+i*d} style={lineStyle}/>
        });

        // Legend
        const textLeft = legendNumbers.map((n, i)=>{
            return <text key={i} x="7" y={boardHeight-padding-d*i+5} textAnchor="middle" style={textStyle}>{n}</text>
        });
        const textRight = legendNumbers.map((n, i)=>{
            return <text key={i} x="615" y={boardHeight-padding-d*i+5} textAnchor="middle" style={textStyle}>{n}</text>
        });

        const textTop = legendLetters.map((c,i)=>{
            return <text key={i} y="20" x={padding+i*d} textAnchor="middle" style={textStyle} >{c}</text>
        });

        const textBottom = legendLetters.map((c,i)=>{
            return <text key={i} y="625" x={padding+i*d} textAnchor="middle" style={textStyle} >{c}</text>
        });

        const whiteStonePositions = (this.props.game as any).get('field').map((v,i)=>{
            if(v.stone === 'white')
            return i;
        }).filter(isFinite);

        const blackStonePositions = (this.props.game as any).get('field').map((v,i)=>{
            if(v.stone === 'black')
                return i;
        }).filter(isFinite);
        
        const whitheStones = whiteStonePositions.map(i=>{
            var x = i%width;
            var y = Math.floor(i/height);
            return <circle key={i} r={radius} cx={padding + x*d} cy={padding + y*d} stroke="rgb(0,0,0)" strokeWidth="2" fill="rgba(255,255,255,0.9)"/>
        });

        const blackStones = blackStonePositions.map(i=>{
            var x = i%width;
            var y = Math.floor(i/height);
            return <circle key={i} r={radius} cx={padding + x*d} cy={padding + y*d} stroke="rgb(0,0,0)" strokeWidth="2" fill="rgba(0,0,0,0.9)"/>
        });

        return (
            <div>
                <svg width={boardWidth} height={boardHeight}>
                    {linesH}
                    {linesW}
                    {textLeft}
                    {textRight}
                    {textTop}
                    {textBottom}
                    {blackStones}
                    {whitheStones}
                    <BoardHover gameActions={this.props.gameActions} playersTurn={this.props.game.turn} boardSize={boardSize} physicalSize={{width: boardWidth, height: boardHeight}} />
                </svg>
            </div>
        );
    }
}