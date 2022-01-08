package main

import (
	jwriter "github.com/CosmWasm/tinyjson/jwriter"
	"github.com/pion/explainer"
)

//nolint: deadcode, unused, golint
type (
	Result = explainer.Result
)

const (
	bufferSize int = 500000
)

//nolint: unused, golint, gochecknoglobals
var (
	buffer                  [bufferSize]byte
	peerConnectionExplainer explainer.PeerConnectionExplainer
)

func main() {}

//export getWasmMemoryBufferOffset
func getWasmMemoryBufferOffset() *[bufferSize]byte { //nolint: deadcode, unused
	return &buffer
}

func maybeInitExplainer() { //nolint: deadcode, unused
	if peerConnectionExplainer == nil {
		peerConnectionExplainer = explainer.NewPeerConnectionExplainer()
	}
}

// SetLocalDescription updates the PeerConnectionExplainer with the provided SessionDescription
//export SetLocalDescription
func SetLocalDescription(length int) { //nolint: unused, deadcode
	maybeInitExplainer()
	peerConnectionExplainer.SetLocalDescription(string(buffer[:length]))
}

// SetRemoteDescription updates the PeerConnectionExplainer with the provided SessionDescription
//export SetRemoteDescription
func SetRemoteDescription(length int) { //nolint: deadcode, unused, golint
	maybeInitExplainer()
	peerConnectionExplainer.SetRemoteDescription(string(buffer[:length]))
}

// Explain returns the result of the current PeerConnectionExplainer.
//export Explain
func Explain() int { //nolint: deadcode, unused
	maybeInitExplainer()

	w := jwriter.Writer{}
	tinyjsonA669327EncodeGithubComPionPeerconnectionExplainer(&w, peerConnectionExplainer.Explain())
	if w.Error != nil {
		return 0
	}

	return copy(buffer[:], w.Buffer.BuildBytes())
}

// GetLocalDescription returns the current SDP we are using from SetLocalDescription
//export GetLocalDescription
func GetLocalDescription() int { //nolint: deadcode, unused
	maybeInitExplainer()

	return copy(buffer[:], peerConnectionExplainer.GetLocalDescription())
}

// GetRemoteDescription returns the current SDP we are using from GetRemoteDescription
//export GetRemoteDescription
func GetRemoteDescription() int { //nolint: deadcode, unused
	maybeInitExplainer()

	return copy(buffer[:], peerConnectionExplainer.GetRemoteDescription())
}
