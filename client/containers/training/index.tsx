import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';

import { Button } from '../../components/button';
//import { ProgressBar } from 'react-bootstrap';
const { ProgressBar } = require('react-bootstrap');

import * as TrainingActions from '../../actions/training';
import loadData from '../../training/load';

require('./index.scss');

export namespace App {
  export interface Props extends RouteComponentProps<void> {

    state: RootState;
    trainingActions: typeof TrainingActions;

  }

  export interface State {
    /* empty */
  }
}

class AppComponent extends React.Component<App.Props, App.State> {

  render(): React.ReactNode {
    const { state, children } = this.props;
    const appStyle = {
    };
    const gameStyle = {

    };

    const { loading } = state.training;
    const { progress } = loading;

    return (
      <div className="training-app" style={appStyle} >
        <h2>Training</h2>
        <Button onClicked={() => loadData(this.props.trainingActions.updateProgress)}>Load data </Button>
        <p style={{ margin: '5px' }}>{loading.description}</p>
        <ProgressBar active={progress.finished < progress.total} now={progress.finished / progress.total * 100} label={`${progress.finished} of ${progress.total}`} />
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
    trainingActions: bindActionCreators(TrainingActions, dispatch)
  };
}

export const App = withRouter(connect(mapStateToProps, mapDispatchToProps)(AppComponent));