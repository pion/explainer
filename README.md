<h1 align="center">
  <br>
  Pion Explainer
  <br>
</h1>
<h4 align="center">Explainer decodes WebRTC... so you don't have too!</h4>
<p align="center">
  <a href="https://pion.ly"><img src="https://img.shields.io/badge/pion-explainer-gray.svg?longCache=true&colorB=brightgreen" alt="Explainer"></a>
  <a href="https://discord.gg/PngbdqpFbt"><img src="https://img.shields.io/badge/join-us%20on%20discord-gray.svg?longCache=true&logo=discord&colorB=brightblue" alt="join us on Discord"></a> <a href="https://bsky.app/profile/pion.ly"><img src="https://img.shields.io/badge/follow-us%20on%20bluesky-gray.svg?longCache=true&logo=bluesky&colorB=brightblue" alt="Follow us on Bluesky"></a>
  <br>
  <img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/pion/explainer/test.yaml">
  <a href="https://pkg.go.dev/github.com/pion/explainer"><img src="https://pkg.go.dev/badge/github.com/pion/explainer.svg" alt="Go Reference"></a>
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

### Roadmap
The library is used as a part of our WebRTC implementation. Please refer to that [roadmap](https://github.com/pion/webrtc/issues/9) to track our major milestones.

### Community
Pion has an active community on the [Discord](https://discord.gg/PngbdqpFbt).

Follow the [Pion Bluesky](https://bsky.app/profile/pion.ly) or [Pion Twitter](https://twitter.com/_pion) for project updates and important WebRTC news.

We are always looking to support **your projects**. Please reach out if you have something to build!
If you need commercial support or don't want to use public methods you can contact us at [team@pion.ly](mailto:team@pion.ly)

### Contributing
Check out the [contributing wiki](https://github.com/pion/webrtc/wiki/Contributing) to join the group of amazing people making this project possible

### License
MIT License - see [LICENSE](LICENSE) for full text