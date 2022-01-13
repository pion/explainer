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

* **Debugging** - Discover common errors without having to read and compare SDP values.
* **Learning** - Learn SDP keys and values and how they effect your WebRTC sessions.
* **Passive Monitoring** - Add `Explainer` to your existing Signaling and Media servers. Surface and fix existing issues.
* **Custom Tooling** - Include `Explainer` with your own UI in an existing project. Make it easier for your customers to use WebRTC.

### Features

* **Session Description Parsing** - Human readable JSON output explaining your Offer/Answer
* **Session Description Suggestions** - Searches for errors and possible improvements, not just explaining the current values.
* **Made for Learning** - Returns line numbers for suggestion and parsing.
* **Portable** - Available in Browser, Go, nodejs, C/C++, Java, C# and more thanks to WASM.
* **Interactive** - Web demo provides interactive discovery of the SessionDescription.
* **Flexible** - Accepts SesionDescriptions or SDP, either value can be base64
* **Decoupled** - Easily ship your own UI, `Explainer` can run on clients or servers

#### Future Features

* **getStats Parsing** - Human readable JSON output explaining the status of your PeerConnection. What it is sending and why.
* **getStats Suggestions** - Understand why a certain bitrate is being sent or why you are seeing video corruption.
* **getStats Graphing** - Generate values that are easily plottable in your tool of choice.

### Running

Examples for different languages are in the `examples` directory. A Web UI is provided in the `web` directory.

Each example will have a `README.md` describing its specific setup.
