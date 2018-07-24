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
import trainOnRecords from '../../training/train';
import { assert } from '@tensorflow/tfjs-core/dist/util';

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
    const { state, children, trainingActions } = this.props;
    const appStyle = {
    };
    const gameStyle = {

    };

    const { loading, trainingsData } = state.training;
    const { progress } = loading;

    return (
      <div className="training-app" style={appStyle} >
        <h2>Loading training data</h2>
        <Button onClicked={() => loadData(trainingActions.updateProgress, trainingActions.loadData)}>Load data </Button>
        <p style={{ margin: '5px' }}>{loading.description}</p>
        <ProgressBar active={progress.finished < progress.total} now={progress.finished / progress.total * 100} label={`${progress.finished} of ${progress.total}`} />
        <h2>Training</h2>
        {/* <Button onClick={() => trainOnRecords(trainingActions.updateTrainingsProgress, trainingsData)}>Training</Button> */}
        <Button onClick={() => console.log('Training')}>Training</Button>
        <p>Training not started yet</p>
        <ProgressBar />
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

export const App = withRouter(connect(mapStateToProps, mapDispatchToProps as any)(AppComponent));