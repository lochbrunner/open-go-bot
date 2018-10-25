import {createAction} from 'redux-actions';

import * as Actions from './constants';

export interface ActionUpdateImagePayload { pixels: number[][]; }

export interface ActionUpdatePixelPayload {
  x: number;
  y: number;
  value: number;
}

export type ActionPayload = ActionUpdateImagePayload|ActionUpdatePixelPayload;

export const updateImage =
    createAction<ActionUpdateImagePayload>(Actions.UPDATE_IMAGE);

export const updatePixel =
    createAction<ActionUpdatePixelPayload>(Actions.UPDATE_PIXEL);