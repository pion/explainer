/* global WebAssembly, TextDecoder, TextEncoder */

require('./wasm_exec.js')
const go = new global.Go()
const importObject = go.importObject

const remoteDescription = `{"type": "offer", "sdp": "v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nc=IN IP4 127.0.0.1\r\nt=0 0\r\nm=audio 4000 RTP/AVP 111\r\na=rtpmap:111 OPUS/48000/2\r\nm=video 4002 RTP/AVP 96\r\na=rtpmap:96 VP8/90000"}`
const localDescription = `{"type": "offer", "sdp": "v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nc=IN IP4 127.0.0.1\r\nt=0 0\r\nm=audio 4000 RTP/AVP 111\r\na=rtpmap:111 OPUS/48000/2\r\nm=video 4002 RTP/AVP 96\r\na=rtpmap:96 VP8/90000"}`

WebAssembly.instantiate(require('fs').readFileSync('wasm.wasm'), importObject).then(wasmModule => {
  go.run(wasmModule.instance)
  let exports = wasmModule.instance.exports

  let wasmMemory = new Uint8Array(exports.memory.buffer)
  let memoryOffset = exports.getWasmMemoryBufferOffset()

  wasmMemory.set((new TextEncoder().encode(remoteDescription)), memoryOffset)
  exports.SetRemoteDescription(remoteDescription.length)

  wasmMemory.set((new TextEncoder().encode(localDescription)), memoryOffset)
  exports.SetLocalDescription(localDescription.length)

  let explainSize = exports.Explain()
  console.log(new TextDecoder().decode(wasmMemory.subarray(memoryOffset, memoryOffset + explainSize)))
})
