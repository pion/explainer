require('./wasm_exec.js')

const wasmBuffer = require('fs').readFileSync('wasm.wasm')
WebAssembly.instantiate(wasmBuffer, new global.Go().importObject).then(peerConnectionExplainerWASM => {
  let exports = peerConnectionExplainerWASM.instance.exports
  let peerConnectionExplainer = exports.NewPeerConnectionExplainer()

  exports.SetLocalDescription(peerConnectionExplainer, {})
  exports.SetRemoteDescription(peerConnectionExplainer, {})
  console.log(exports.Explain(peerConnectionExplainer))
}).catch(e => {
  console.log(e)
})
