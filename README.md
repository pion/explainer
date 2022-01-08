<h1 align="center">
  <br>
  Explainer
  <br>
</h1>
<h4 align="center">Explainer decodes WebRTC... so you don't have too!</h4>
<p align="center">
  <a href="https://pion.ly"><img src="https://img.shields.io/badge/pion-explainer-gray.svg?longCache=true&colorB=brightgreen" alt="Explainer"></a>
  <a href="https://pion.ly/slack"><img src="https://img.shields.io/badge/join-us%20on%20slack-gray.svg?longCache=true&logo=slack&colorB=brightgreen" alt="Slack Widget"></a>
  <br>
  <a href="https://pkg.go.dev/github.com/pion/explainer"><img src="https://godoc.org/github.com/pion/explainer?status.svg" alt="GoDoc"></a>
  <a href="https://codecov.io/gh/pion/explainer"><img src="https://codecov.io/gh/pion/explainer/branch/master/graph/badge.svg" alt="Coverage Status"></a>
  <a href="https://goreportcard.com/report/github.com/pion/explainer"><img src="https://goreportcard.com/badge/github.com/pion/explainer" alt="Go Report Card"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>
<br>

Explainer provides a PeerConnection Explainer that parses WebRTC Offers/Answers then provides summaries and suggestions. It returns information like
what codecs are supported, how many tracks each peer is attempting to send and ICE information. It also provides suggestions to fix common errors.

The goal of this project is to make learning and debugging WebRTC easier.

### Use Cases



### Features

* **Session Description Parsing** - Human readable JSON output explaining your Offer/Answer
* **Session Description Suggestions** - Before debugging try `Pion Explainer` first! Searches for errors and possible improvements.
* **Made for Learning** - Returns line numbers for suggestion and parsing.
* **Portable** -- Available in Browser, Go, nodejs, C/C++, Java, C# and more thanks to WASM!

***Future Features***

* **getStats Parsing** - Human readable JSON output explaining the status of your PeerConnection. What it is sending and why.
* **getStats Suggestions** - Understand why a certain bitrate is being sent or why you are seeing video corruption.
* **getStats Graphing** - Generate values that are easily plottable in your tool of choice.

### Building WASM
From web directory run

```sh
# Copy wasm_exec.js
cp $(tinygo env TINYGOROOT)/targets/wasm_exec.js .

# Building WASM
tinygo build -o wasm.wasm -target wasm  -no-debug --panic trap github.com/pion/explainer/pkg/wasm

# Run HTTP Server
python -m SimpleHTTPServer

# Or instead run node in examples/nodejs
node test.js
```
