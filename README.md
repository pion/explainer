<h1 align="center">
  <br>
  PeerConnection Explainer
  <br>
</h1>
<h4 align="center">PeerConnection Explainer decodes WebRTC... so you don't have too!</h4>
<p align="center">
  <a href="https://pion.ly"><img src="https://img.shields.io/badge/pion-peerconnection_explainer-gray.svg?longCache=true&colorB=brightgreen" alt="PeerConnection_Explainer"></a>
  <a href="https://pion.ly/slack"><img src="https://img.shields.io/badge/join-us%20on%20slack-gray.svg?longCache=true&logo=slack&colorB=brightgreen" alt="Slack Widget"></a>
  <br>
  <a href="https://pkg.go.dev/github.com/pion/peerconnection_explainer"><img src="https://godoc.org/github.com/pion/peerconnection_explainer?status.svg" alt="GoDoc"></a>
  <a href="https://codecov.io/gh/pion/peerconnection_explainer"><img src="https://codecov.io/gh/pion/peerconnection_explainer/branch/master/graph/badge.svg" alt="Coverage Status"></a>
  <a href="https://goreportcard.com/report/github.com/pion/peerconnection_explainer"><img src="https://goreportcard.com/badge/github.com/pion/peerconnection_explainer" alt="Go Report Card"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>
<br>

PeerConnection Explainer parses WebRTC Offers/Answers then provides summaries and suggestions. It returns information like what what codecs are supported, what header extensions are
enabled and how many tracks each peer is attempting to send. It also provides suggestions to fix common errors.

It was designed to make learning and debugging of WebRTC easier.

### Features

* **Session Description Parsing** - Human readable JSON output explaining the provided Offer/Answer
* **Session Description Suggestions** - Before debugging try `PE` first! Searches for errors and possible improvements.
* **Made for Learning** - Returns line numbers for suggestion and parsing.
* **WASM** -- Can be run in browser and most programming languages.

### Planned Features

* **getStats Parsing**
* **getStats Suggestions**
* **getStats Graphing**

### Schema

* DataChannel enabled?
* How many tracks wish to be sent?
* How many tracks are able to be received?
* Audio+Video Codecs
  - Are they all the same for each MediaSection?
* DTLS Fingerprint
  - At Media or Global?
  - Are they all the same?
* ICE ufrag+pwd
  - At Media or Global?
  - Are they all the same?

### Building WASM
From web directory run

```sh
# Building WASM
tinygo build -o wasm.wasm -target wasm  ..

# Run node.js
node test.js
```

