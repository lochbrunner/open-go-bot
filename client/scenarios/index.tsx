import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import * as _ from 'lodash';

import { Graph } from '../components/graph';
import { Button } from '../components/button';

import * as TrainingsActions from '../actions/training';

import * as Go from './go';

const { ProgressBar } = require('react-bootstrap');

interface MatchObject {
    scenario: 'go' | 'mnist' | 'ant';
}

interface OuterScenarioProps extends RouteComponentProps<MatchObject> {
    additionalReducer: () => void;
}

interface InnerScenarioProps {
    state: RootState;
    trainingActions: typeof TrainingsActions;
}

type ScenarioProps = OuterScenarioProps & InnerScenarioProps;

const renderScenario = (props: ScenarioProps) => {
    const { state, trainingActions, match } = props;
    const { training } = state;
    let renderer: React.ComponentType<any> | JSX.Element;
    let legend: string[];
    let featureFactory: () => number[][][];
    if (match.params.scenario === 'go') {
        renderer = <Go.GoApp />;
        legend = Go.legend;
        featureFactory = () => Go.createFeatures(state.go.game);
    }
    else if (match.params.scenario === 'mnist') {

    }
    else {
        renderer = <p>No scenario found with name {match.params.scenario}</p>;
        featureFactory = () => [];
        legend = [];
    }
    return (
        <div>
            {renderer}
            <div className="graph-section">
                <Graph inputLegend={legend} createFeatures={featureFactory} graph={state.graph} />
            </div>
            <div className="train">
                <Button onClicked={() => trainingActions.train(state.graph)} style={{}} >Train</Button>
                <p>{training.training.description}</p>
                <ProgressBar active={true} now={training.training.progress.finished / training.training.progress.total * 100} label={`${training.training.progress.finished} of ${training.training.progress.total}`} />
            </div>
        </div>
    );
};

const mapStateToProps = (state: RootState): Partial<ScenarioProps> => ({
    state
});

const mapDispatchToProps = (dispatch): Partial<ScenarioProps> => ({
    trainingActions: bindActionCreators(TrainingsActions, dispatch)
});

const mergeProps = (stateProps: Partial<ScenarioProps>, dispatchProps: Partial<ScenarioProps>, ownProps: Partial<ScenarioProps>) => {
    return { ...ownProps, ...stateProps, ...dispatchProps } as ScenarioProps;
};

const ScenarioContainer = withRouter(connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps as any
)(renderScenario));

export default ScenarioContainer;