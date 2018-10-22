import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import { Loader, TrainingData } from '../../actions/training/train';

require('./index.scss');

export namespace Mnist {
  export interface Props {

  }
}

const render = (props: Mnist.Props) => {
  return (
    <div>
      <h1>MNIST coming soon...</h1>
    </div>
  );
};

const mapStateToProps = (state: {}) => ({});

const mapDispatchToProps = (dispatch) => ({});

export const MnistApp = connect(mapStateToProps, mapDispatchToProps as any)(render);

export const legend = _.times(10).map((v, i) => i.toString());

export const loader: Loader = (reporter, maxSamples) => {
  return new Promise<TrainingData>((resolve, reject) => {
    resolve();
  });
};