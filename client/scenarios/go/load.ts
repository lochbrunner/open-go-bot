import {createFeatures, createLabel} from './encoder';

import {EmptyGame, loadGame, nextStep, putStone} from './reducers/game-logic';

export interface Progress {
  description: string;
  progress: {finished: number, total: number};
}

// function createsSamples() {}
declare class TextDecoder {
  constructor(coding: string);
  decode(text: ArrayBuffer): string;
}

function encode2utf8(text: string|ArrayBuffer): string {
  if (typeof(text) === 'string') return text;
  const encoder = new TextDecoder('utf-8');
  return encoder.decode(text);
}

async function readBlob(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(encode2utf8(reader.result));
    reader.readAsText(blob);
  });
}

async function loadTextFile(path: string): Promise<string> {
  const response = await fetch('/' + path);
  if (!response.ok) {
    throw new Error(
        `Error ${
                 response.status
               } while trying to load trainings data: ${response.statusText}`);
  }
  const blob = await response.blob();

  return await readBlob(blob);
}

async function processGame(
    path: string, maxSamples: number, features: TrainingsData['features'],
    labels: TrainingsData['labels']): Promise<number> {
  try {
    const sgf = await loadTextFile(path);
    const game = loadGame(new EmptyGame(), sgf);
    for (let step of game.steps) {
      --maxSamples;
      if (maxSamples < 0) break;
      features.push(createFeatures(game));
      labels.push(createLabel(game));
      nextStep(game);
    }
    return game.steps.length;
  } catch (error) {
    console.log(
        `There has been a problem when process a game: ${error.message}`,
    );
    return 0;
  }
}

export default async function
load(reporter: (msg: Progress) => void, count: number): Promise<
    {features: TrainingsData['features'], labels: TrainingsData['labels']}> {
  try {
    const text = await loadTextFile('sitemap.txt');
    // Make this constant a hyper-paramter
    const maxSamples = count;
    const features: TrainingsData['features'] = [];
    const labels: TrainingsData['labels'] = [];
    for (let line of text.split('\n')) {
      if (maxSamples <= features.length) break;
      const fileName = line.substr(2);
      reporter({
        description: `Loading ${fileName} ...`,
        progress: {finished: features.length, total: maxSamples}
      });
      await processGame(
          fileName, maxSamples - features.length, features, labels);
    }
    reporter({
      description: `Finished loading`,
      progress: {finished: features.length, total: maxSamples}
    });
    return {features, labels};
  } catch (error) {
    reporter({
      description: `An error occurred: ${error.message}`,
      progress: {finished: 0, total: 1}
    });
  }
}