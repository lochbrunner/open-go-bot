import * as React from 'react';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import * as GameActions from '../../actions/game';
import * as DisplayActions from '../../actions/display-settings';

import { Board } from '../../components/board';
import { CheckButton } from '../../components/check-button';
import { Button } from '../../components/button';
import { FileButton } from '../../components/file-button';

import { Menu } from '../../components/menu';
import { Graph } from '../../components/graph';

require('./index.scss');

export namespace App {
  export interface Props extends RouteComponentProps<void> {

    state: RootState;

    gameActions: typeof GameActions;
    displaySettingsActions: typeof DisplayActions;
  }

  export interface State {
    /* empty */
  }
}

@connect(mapStateToProps, mapDispatchToProps as any)
export class App extends React.Component<App.Props, App.State> {

  render(): React.ReactNode {
    const { state, children, gameActions, displaySettingsActions } = this.props;
    const appStyle = {
    };
    const gameStyle = {
      width: '40%'
    };
    const graphStyle = {

    };

    return (
      <div style={appStyle} >
        <div className="game-section">
          <h3>{state.game.info.title}</h3>
          <h4>{state.game.info.oponents.black} - {state.game.info.oponents.white}</h4>
          <p>Captured Stones: Black: {state.game.capturedStones.black} White: {state.game.capturedStones.white}</p>
          <Board gameActions={gameActions} game={state.game} displaySettings={state.displaySettings} disabled={state.game.currentStep !== -1} />
          <Menu state={state} gameActions={gameActions} displaySettingsActions={displaySettingsActions} />
        </div>
        <div className="graph-section">
          <Graph game={state.game} />
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
    displaySettingsActions: bindActionCreators(DisplayActions, dispatch)
  };
}
