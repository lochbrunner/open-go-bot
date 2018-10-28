import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import { Loader, TrainingData } from '../../actions/training/train';

import * as MnistActions from './actions';
import * as TrainingActions from '../../actions/training';

import { ImageEditor } from './components/image-editor';
import { bindActionCreators } from 'redux';

export { reducers } from './reducers';

import { Button } from '../../components/button';
import { KEY_CODE_ARROW_LEFT, KEY_CODE_ARROW_RIGHT } from '../../commons/constants';
import { MnistData } from './actions/data';

require('./index.scss');

export namespace Mnist {
  export interface Props {
    mnist: MnistState;
    training: Training;
    mnistActions: typeof MnistActions;
    trainingActions: typeof TrainingActions;
  }
}

export const dataProvider: DataProvider = new MnistData();

const render = (props: Mnist.Props) => {
  const resolution = 28;
  const enableStepping = props.mnist.hasLoaded;
  const { mnistActions } = props;
  const showImage = index => mnistActions.showImage(dataProvider, index);
  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.keyCode) {
      case KEY_CODE_ARROW_RIGHT:
        if (enableStepping) showImage(props.mnist.caret + 1);
        break;
      case KEY_CODE_ARROW_LEFT:
        if (enableStepping && props.mnist.caret > 0) showImage(props.mnist.caret - 1);
        break;
    }
  };

  const { prediction } = props.mnist;

  return (
    <div className="mnist">
      <h1>MNIST coming soon...</h1>
      <div className="display">
        <ImageEditor update={mnistActions.updatePixel}
          pixels={props.mnist.currentInput.pixels}
          size={{ height: 400, width: 400 }}
          resolution={{ height: resolution, width: resolution }} />
        <p className="ground-truth">Ground Truth: {props.mnist.groundTruth}</p>
        <p className="prediction">Prediction{prediction ? ` ${prediction.value} (${prediction.uncertainty * 100}%)` : ''}</p>
      </div>
      <div tabIndex={0} onKeyDown={onKeyDown.bind(this)}>
        <Button onClicked={() => mnistActions.clearImage({})} >Clear</Button>
        <Button onClicked={() => mnistActions.loadTrainingsData(dataProvider)} >Load</Button>
        <Button disabled={!enableStepping || props.mnist.caret <= 0} onClicked={() => showImage(props.mnist.caret - 1)} >Previous</Button>
        <Button disabled={!enableStepping} onClicked={() => showImage(props.mnist.caret)} >Reload</Button>
        <Button disabled={!enableStepping} onClicked={() => showImage(props.mnist.caret + 1)} >Next</Button>
        <Button onClicked={() => props.trainingActions.predictAction(props.mnistActions.updatePrediction, props.mnist.currentInput.pixels)}>Predict</Button>
      </div>
    </div >
  );
};

const mapStateToProps: (state: RootState) => Partial<Mnist.Props> = (state: RootState) => ({
  mnist: state.mnist,
  training: state.training
});

const mapDispatchToProps = (dispatch): Partial<Mnist.Props> => ({
  mnistActions: bindActionCreators(MnistActions, dispatch),
  trainingActions: bindActionCreators(TrainingActions, dispatch)
});

export const MnistApp = connect(mapStateToProps, mapDispatchToProps)(render);

export const legend = _.times(10).map((v, i) => i.toString());

export const loader: Loader = (reporter, maxSamples) => {
  return new Promise<TrainingData>((resolve, reject) => {
    resolve();
  });
};

export const createInitialState: () => MnistState = () => ({
  currentInput: {
    pixels: _.times(28).map(r => _.times(28, i => 0))
  },
  groundTruth: '-',
  caret: -1,
  hasLoaded: false
});