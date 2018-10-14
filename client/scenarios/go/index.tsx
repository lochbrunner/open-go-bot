import * as React from 'react';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import * as GameActions from './actions/game';
import * as DisplayActions from './actions/display-settings';
import * as TrainingsActions from '../../actions/training';

import { Board } from './board';
import { Button } from '../../components/button';

import { Menu } from './menu';
import { Graph } from '../../components/graph';

const { ProgressBar } = require('react-bootstrap');

require('./index.scss');

export namespace App {
  export interface Props extends RouteComponentProps<void> {

    state: RootState;

    gameActions: typeof GameActions;
    displaySettingsActions: typeof DisplayActions;
    trainingActions: typeof TrainingsActions;
  }

  export interface State {
    /* empty */
  }
}

class AppComponent extends React.Component<App.Props, App.State> {

  render(): React.ReactNode {
    const { state, children, gameActions, displaySettingsActions, trainingActions } = this.props;
    const appStyle = {
    };
    const gameStyle = {
      width: '40%'
    };
    const graphStyle = {

    };
    const { training } = state;

    return (
      <div style={appStyle} >
        <div className="game-section">
          <h3>{state.game.info.title}</h3>
          <h4>{state.game.info.opponents.black} - {state.game.info.opponents.white}</h4>
          <p>Captured Stones: Black: {state.game.capturedStones.black} White: {state.game.capturedStones.white}</p>
          <Board gameActions={gameActions} game={state.game} displaySettings={state.displaySettings} disabled={state.game.currentStep !== -1} />
          <Menu state={state} gameActions={gameActions} displaySettingsActions={displaySettingsActions} />
        </div>
        <div className="graph-section">
          <Graph game={state.game} graph={state.graph} />
        </div>
        <div className="train">
          <Button onClicked={() => trainingActions.train(state.graph)} style={{}} >Train</Button>
          <p>{training.training.description}</p>
          <ProgressBar style={{ width: '500px' }} active={true} now={training.training.progress.finished / training.training.progress.total * 100} label={`${training.training.progress.finished} of ${training.training.progress.total}`} />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state: RootState): Partial<App.Props> {
  return {
    state
  };
}

function mapDispatchToProps(dispatch): Partial<App.Props> {
  return {
    gameActions: bindActionCreators(GameActions, dispatch),
    displaySettingsActions: bindActionCreators(DisplayActions, dispatch),
    trainingActions: bindActionCreators(TrainingsActions, dispatch)
  };
}

export const App = withRouter(connect(mapStateToProps, mapDispatchToProps as any)(AppComponent));