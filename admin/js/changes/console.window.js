const origLog  = console.log;
const origWarn = console.warn;

console.log = (...args) => {
    parent.window.postMessage({ type: 'log', args: args }, '*')
    origLog(...args)
};