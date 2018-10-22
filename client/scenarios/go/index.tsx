import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as GoActions from './actions';

import { Board } from './board';
import { Menu } from './menu';
import load from './load';
import initialGraph from './reducers/initial-graph';

export { legend, createFeatures } from './encoder';
export { createInitialState, reducers } from './reducers';

export const loader = load;
export const createInitialGraph = initialGraph;

require('./index.scss');

export namespace Go {
  export interface Props {
    go: Go;
    goActions: typeof GoActions;
  }
}

export const render = (props: Go.Props) => {
  const title = 'Social AI - Go';
  if (document.title !== title)
    document.title = title;
  const { go, goActions } = props;
  const { game } = go;
  const { info, capturedStones } = game;
  return (
    <div className="game-section">
      <h3>{info.title}</h3>
      <h4>{info.opponents.black} - {info.opponents.white}</h4>
      <p>Captured Stones: Black: {capturedStones.black} White: {capturedStones.white}</p>
      <Board gameActions={goActions} game={game} displaySettings={go.displaySettings} disabled={game.currentStep !== -1} />
      <Menu go={go} goActions={goActions} />
    </div>
  );
};

const mapStateToProps = (state: RootState): Partial<Go.Props> => ({ go: state.go });

const mapDispatchToProps = (dispatch): Partial<Go.Props> => ({
  goActions: bindActionCreators(GoActions, dispatch)
});

export const GoApp = connect(mapStateToProps, mapDispatchToProps)(render);
