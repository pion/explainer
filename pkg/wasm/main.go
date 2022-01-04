package main

import (
	jlexer "github.com/CosmWasm/tinyjson/jlexer"
	jwriter "github.com/CosmWasm/tinyjson/jwriter"
	"github.com/pion/explainer"
)

//nolint: deadcode, unused, golint
type (
	SessionDescription = explainer.SessionDescription
	Result             = explainer.Result
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
	s := SessionDescription{}

	r := jlexer.Lexer{Data: buffer[:length]}
	tinyjsonEa60cfe6DecodeGithubComPionPeerconnectionExplainer(&r, &s)
	if r.Error() != nil {
		return
	}

	maybeInitExplainer()
	peerConnectionExplainer.SetLocalDescription(s)
}

// SetRemoteDescription updates the PeerConnectionExplainer with the provided SessionDescription
//export SetRemoteDescription
func SetRemoteDescription(length int) { //nolint: deadcode, unused, golint
	s := SessionDescription{}

	r := jlexer.Lexer{Data: buffer[:length]}
	tinyjsonEa60cfe6DecodeGithubComPionPeerconnectionExplainer(&r, &s)
	if r.Error() != nil {
		return
	}

	maybeInitExplainer()
	peerConnectionExplainer.SetRemoteDescription(s)
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
