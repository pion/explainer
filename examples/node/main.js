// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

const remoteDescription = `{"type": "offer", "sdp": "v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nc=IN IP4 127.0.0.1\r\nt=0 0\r\nm=audio 4000 RTP/AVP 111\r\na=rtpmap:111 OPUS/48000/2\r\nm=video 4002 RTP/AVP 96\r\na=rtpmap:96 VP8/90000"}`
const localDescription = `{"type": "answer", "sdp": "v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nc=IN IP4 127.0.0.1\r\nt=0 0\r\nm=audio 4000 RTP/AVP 111\r\na=rtpmap:111 OPUS/48000/2\r\nm=video 4002 RTP/AVP 96\r\na=rtpmap:96 VP8/90000"}`

globalThis.require = require;
globalThis.fs = require("fs");
globalThis.TextEncoder = require("util").TextEncoder;
globalThis.TextDecoder = require("util").TextDecoder;

globalThis.performance = {
	now() {
		const [sec, nsec] = process.hrtime();
		return sec * 1000 + nsec / 1000000;
	},
};

const crypto = require("crypto");
globalThis.crypto = {
	getRandomValues(b) {
		crypto.randomFillSync(b);
	},
};

require("./wasm_exec");

const go = new Go();
WebAssembly.instantiate(fs.readFileSync('wasm.wasm'), go.importObject).then((result) => {
	go.run(result.instance);

  result_str = explain(localDescription, remoteDescription)
  result = JSON.parse(result_str)
  console.log(result)
}).catch((err) => {
	console.error(err);
	process.exit(1);
});