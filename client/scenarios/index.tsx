import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import * as _ from 'lodash';

import { Graph } from '../components/graph';
import { Button } from '../components/button';

import * as TrainingsActions from '../actions/training';
import * as GraphActions from '../actions/graph';

import * as Go from './go';
import * as Mnist from './mnist';
import { Loader } from '../actions/training/train';
import { loadWeightsFromGraph } from '../utilities/tf-model';

const { ProgressBar } = require('react-bootstrap');

require('./index.scss');

interface MatchObject {
    scenario: 'go' | 'mnist' | 'ant';
}

interface OuterScenarioProps extends RouteComponentProps<MatchObject> {
    additionalReducer: () => void;
}

interface InnerScenarioProps {
    state: RootState;
    trainingActions: typeof TrainingsActions;
    graphActions: typeof GraphActions;
}

type ScenarioProps = OuterScenarioProps & InnerScenarioProps;

const renderScenario = (props: ScenarioProps) => {
    const { state, trainingActions, match } = props;
    if (state.graph.loadedScenario !== match.params.scenario) {
        setImmediate(() => props.graphActions.loadScenario(match.params.scenario));
    }
    const { training } = state;
    let renderer: React.ComponentType<any> | JSX.Element;
    let inputLegend: string[];
    let outputLegend: string[];
    let featureFactory: () => number[][][] | number[][];
    let dataProvider: DataProvider;
    if (match.params.scenario === 'go') {
        renderer = <Go.GoApp />;
        inputLegend = Go.legend;
        featureFactory = () => Go.createFeatures(state.go.game);
    }
    else if (match.params.scenario === 'mnist') {
        renderer = <Mnist.MnistApp />;
        outputLegend = Mnist.outputLegend;
        inputLegend = Mnist.inputLegend;
        dataProvider = Mnist.dataProvider;
        featureFactory = () => Mnist.createFeatures(state.mnist);
    }
    else {
        renderer = <p>No scenario found with name {match.params.scenario}</p>;
        featureFactory = () => [];
    }
    return (
        <div className="scenarios">
            {renderer}
            <div className="graph-section">
                <Graph inputLegend={inputLegend} createFeatures={featureFactory} graph={state.graph} graphActions={props.graphActions} />
            </div>
            <div className="train">
                <Button onClicked={() => trainingActions.train(dataProvider, state.graph)} style={{}} >Train</Button>
                <p>{training.training.description}</p>
                <ProgressBar active={true} now={training.training.progress.finished / training.training.progress.total * 100} label={`${training.training.progress.finished} of ${training.training.progress.total} `} />
            </div>
        </div>
    );
};

const mapStateToProps = (state: RootState): Partial<ScenarioProps> => ({
    state
});

const mapDispatchToProps = (dispatch): Partial<ScenarioProps> => ({
    trainingActions: bindActionCreators(TrainingsActions, dispatch),
    graphActions: bindActionCreators(GraphActions, dispatch)
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