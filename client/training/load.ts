import {loadGame, EmptyGame, putStone, nextStep} from '../utilities/game-logic';
import {createFeatures, createLabel} from '../utilities/encoder';


export interface TrainingProgress {
  description: string;
  progress: {finished: number, total: number};
}

function createsSamples() {}

function loadTextFile(path: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    fetch(path)
        .then(response => {
          if (response.ok) return response.blob();
          throw new Error('Network response was not ok.');
        })
        .then(blob => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsText(blob);
        });

  });
}

async function processGame(path: string, maxSamples: number,
                           features: number[][][], labels: number[][]):
    Promise<number> {
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
            `There has been a problem when process a game: ${error.message}`, );
        return 0;
      }
    }

export default async function
load(reporter: (msg: TrainingProgress) => void) {
  try {
    const text = await loadTextFile('sitemap.txt');
    // Make this constant a hyperparamter
    const maxSamples = 40000;
    const features: number[][][] = [];
    const labels: number[][] = [];
    for (let line of text.split('\n')) {
      if (maxSamples <= features.length) break;
      const fileName = line.substr(2);
      reporter({
        description: `Loading ${fileName} ...`,
        progress: {finished: features.length, total: maxSamples}
      });
      await processGame(fileName, maxSamples - features.length, features,
                        labels);
    }
    reporter({
      description: `Finished loading`,
      progress: {finished: features.length, total: maxSamples}
    });
  } catch (error) {
    reporter({
      description:
          `There has been a problem with your fetch operation: ${error.message}`,
      progress: {finished: 0, total: 1}

    });
  }
}