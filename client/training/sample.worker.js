
function send(payload) {
  postMessage('From the worker: ' + payload);
  console.log('From the worker: ' + payload);
}
setTimeout(() => send('Hello'), 500);
setTimeout(() => send('how'), 1000);
setTimeout(() => send('are'), 1500);
setTimeout(() => send('you'), 2000);
setTimeout(() => send('?'), 2500);