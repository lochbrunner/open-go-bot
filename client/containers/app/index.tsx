import * as React from 'react';

// import * as style from './style.scss';
// import * as scss from './style.scss';
// require('./style.scss');
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import * as GameActions from '../../actions/game';
import * as DisplayActions from '../../actions/display-settings';

import { Board } from '../../components/board';
import { CheckButton } from '../../components/check-button';
import { Button } from '../../components/button';

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
      width: '800px',
      margin: 'auto'
    };
    const displaySettings = {
      display: 'inline-block',
      float: 'right',
      margin: '20px'
    };

    return (
      <div style={appStyle}>
        <p>Captured Stones: Black: {state.game.capturedStones.black} White: {state.game.capturedStones.white}</p>
        <Board gameActions={gameActions} boardSize={(state.settings as any).get('board')} game={state.game} displaySettings={state.displaySettings} />
        <div style={displaySettings}>
          <CheckButton onSwitched={displaySettingsActions.toggleLibertiesView} checked={(state.displaySettings as any).get('showLiberties')}>Liberties Count</CheckButton>
          <CheckButton onSwitched={displaySettingsActions.toggleIsLibertyView} checked={(state.displaySettings as any).get('showIsLiberty')}>Is Liberty</CheckButton>
          <CheckButton onSwitched={displaySettingsActions.toggleForbiddenView} checked={(state.displaySettings as any).get('showForbidden')}>Forbidden Fields</CheckButton>
          <Button onClicked={gameActions.resetGame}>New Game</Button>
        </div>
        {children}
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
