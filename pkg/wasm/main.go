package main

import (
	jlexer "github.com/CosmWasm/tinyjson/jlexer"
	jwriter "github.com/CosmWasm/tinyjson/jwriter"
	"github.com/pion/peerconnection_explainer"
)

type (
	peerConnectionExplainer int
	SessionDescription      = peerconnection_explainer.SessionDescription
	Result                  = peerconnection_explainer.Result
)

const (
	BUFFER_SIZE int = 500000
)

var (
	buffer       [BUFFER_SIZE]byte
	explainerMap map[peerConnectionExplainer]peerconnection_explainer.PeerConnectionExplainer
)

func main() {}

//export getWasmMemoryBufferOffset
func getWasmMemoryBufferOffset() *[BUFFER_SIZE]byte { //nolint: deadcode
	return &buffer
}

func maybeInitExplainerMap() {
	if explainerMap == nil {
		explainerMap = map[peerConnectionExplainer]peerconnection_explainer.PeerConnectionExplainer{}
	}
}

//export NewPeerConnectionExplainer
func NewPeerConnectionExplainer() peerConnectionExplainer { //nolint: deadcode
	maybeInitExplainerMap()

	newExplainerId := peerConnectionExplainer(0)
	for ; ; newExplainerId++ {
		if _, ok := explainerMap[newExplainerId]; !ok {
			explainerMap[newExplainerId] = peerconnection_explainer.NewPeerConnectionExplainer()
			break
		}
	}

	return newExplainerId
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
