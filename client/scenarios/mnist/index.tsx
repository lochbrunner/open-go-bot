import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import { Loader, TrainingData } from '../../actions/training/train';

import * as MnistActions from './actions';

import { ImageEditor } from './components/image-editor';
import { bindActionCreators } from 'redux';

export { reducers } from './reducers';

import { Button } from '../../components/button';

require('./index.scss');

export namespace Mnist {
  export interface Props {
    mnist: MnistState;
    mnistActions: typeof MnistActions;
  }
}

const render = (props: Mnist.Props) => {
  const resolution = 28;
  const enableStepping = !props.mnist.hasLoaded;
  const { mnistActions } = props;
  return (
    <div className="mnist">
      <h1>MNIST coming soon...</h1>
      <div className="display">
        <ImageEditor update={mnistActions.updatePixel}
          pixels={props.mnist.currentInput.pixels}
          size={{ height: 400, width: 400 }}
          resolution={{ height: resolution, width: resolution }} />
        <p className="ground-truth">Ground Truth: {props.mnist.groundTruth}</p>
      </div>
      <div>
        <Button onClicked={() => mnistActions.clearImage({})} >Clear</Button>
        <Button onClicked={() => mnistActions.loadTrainigsData()} >Load</Button>
        <Button disabled={enableStepping || props.mnist.caret <= 0} onClicked={() => mnistActions.showImage(props.mnist.caret - 1)} >Previous</Button>
        <Button disabled={enableStepping} onClicked={() => mnistActions.showImage(props.mnist.caret)} >Reload</Button>
        <Button disabled={enableStepping} onClicked={() => mnistActions.showImage(props.mnist.caret + 1)} >Next</Button>
      </div>
    </div>
  );
};

const mapStateToProps: (state: RootState) => Partial<Mnist.Props> = (state: RootState) => ({
  mnist: state.mnist
});

const mapDispatchToProps = (dispatch): Partial<Mnist.Props> => ({
  mnistActions: bindActionCreators(MnistActions, dispatch)
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