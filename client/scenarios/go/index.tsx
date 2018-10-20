import * as React from 'react';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as GoActions from './actions';

import { Board } from './board';

import { Menu } from './menu';
import { legend, createFeatures } from './encoder';

export { legend, createFeatures } from './encoder';

require('./index.scss');

export namespace Go {
  export interface Props {

    go: Go;

    goActions: typeof GoActions;
  }
}

export const render = (props: Go.Props) => {
  const { go, goActions } = props;
  const { game } = go;
  return (
    <div className="game-section">
      <h3>{game.info.title}</h3>
      <h4>{game.info.opponents.black} - {game.info.opponents.white}</h4>
      <p>Captured Stones: Black: {game.capturedStones.black} White: {game.capturedStones.white}</p>
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
