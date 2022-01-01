package main

import (
	"github.com/pion/peerconnection_explainer"
)

func main() {}

type (
	peerConnectionExplainer int
	SessionDescription      = peerconnection_explainer.SessionDescription
	Result                  = peerconnection_explainer.Result
)

var explainerMap map[peerConnectionExplainer]peerconnection_explainer.PeerConnectionExplainer

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
func (pe peerConnectionExplainer) SetLocalDescription(sessionDescription SessionDescription) {
	maybeInitExplainerMap()
	if pe, ok := explainerMap[pe]; ok {
		pe.SetLocalDescription(sessionDescription)
	}

}

//export SetRemoteDescription
func (pe peerConnectionExplainer) SetRemoteDescription(sessionDescription SessionDescription) {
	maybeInitExplainerMap()
	if pe, ok := explainerMap[pe]; ok {
		pe.SetRemoteDescription(sessionDescription)
	}
}

//export Explain
func (pe peerConnectionExplainer) Explain() Result {
	maybeInitExplainerMap()

	if pe, ok := explainerMap[pe]; ok {
		return pe.Explain()
	}
	return Result{}
}
