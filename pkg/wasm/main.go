package main

import (
	jlexer "github.com/CosmWasm/tinyjson/jlexer"
	jwriter "github.com/CosmWasm/tinyjson/jwriter"
	"github.com/pion/explainer"
)

type (
	peerConnectionExplainer int
	SessionDescription      = explainer.SessionDescription //nolint: golint
	Result                  = explainer.Result             //nolint: golint
)

const (
	bufferSize int = 500000
)

var (
	buffer       [bufferSize]byte                                              //nolint: gochecknoglobals
	explainerMap map[peerConnectionExplainer]explainer.PeerConnectionExplainer //nolint: gochecknoglobals
)

func main() {}

//export getWasmMemoryBufferOffset
func getWasmMemoryBufferOffset() *[bufferSize]byte { //nolint: deadcode, unused
	return &buffer
}

func maybeInitExplainerMap() {
	if explainerMap == nil {
		explainerMap = map[peerConnectionExplainer]explainer.PeerConnectionExplainer{}
	}
}

// NewPeerConnectionExplainer creates a new PeerConnectionExplainer
//export NewPeerConnectionExplainer
func NewPeerConnectionExplainer() peerConnectionExplainer { //nolint: deadcode, golint, unused
	maybeInitExplainerMap()

	newExplainerID := peerConnectionExplainer(0)
	for ; ; newExplainerID++ {
		if _, ok := explainerMap[newExplainerID]; !ok {
			explainerMap[newExplainerID] = explainer.NewPeerConnectionExplainer()
			break
		}
	}

	return newExplainerID
}

//export SetLocalDescription
func (pe peerConnectionExplainer) SetLocalDescription(length int) {
	s := SessionDescription{}

	r := jlexer.Lexer{Data: buffer[:length]}
	tinyjsonEa60cfe6DecodeGithubComPionPeerconnectionExplainer(&r, &s)
	if r.Error() != nil {
		return
	}

	maybeInitExplainerMap()
	if pe, ok := explainerMap[pe]; ok {
		pe.SetLocalDescription(s)
	}
}

//export SetRemoteDescription
func (pe peerConnectionExplainer) SetRemoteDescription(length int) {
	s := SessionDescription{}

	r := jlexer.Lexer{Data: buffer[:length]}
	tinyjsonEa60cfe6DecodeGithubComPionPeerconnectionExplainer(&r, &s)
	if r.Error() != nil {
		return
	}

	maybeInitExplainerMap()
	if pe, ok := explainerMap[pe]; ok {
		pe.SetRemoteDescription(s)
	}
}

//export Explain
func (pe peerConnectionExplainer) Explain() int {
	maybeInitExplainerMap()

	if pe, ok := explainerMap[pe]; ok {
		w := jwriter.Writer{}
		tinyjsonA669327EncodeGithubComPionPeerconnectionExplainer(&w, pe.Explain())
		if w.Error != nil {
			return 0
		}

		return copy(buffer[:], w.Buffer.BuildBytes())
	}

	return 0
}
