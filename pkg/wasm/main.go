// SPDX-FileCopyrightText: 2026 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

//go:build js
// +build js

// Package main implements a WASM example
package main

import (
	"encoding/json"
	"syscall/js"

	"github.com/pion/explainer"
)

//nolint:gochecknoglobals
var (
	exp explainer.PeerConnectionExplainer
)

func explain(_ js.Value, inputs []js.Value) interface{} {
	if len(inputs) != 2 {
		panic("invalid number of inputs") //nolint:forbidigo
	}

	localDescription := inputs[0].String()
	remoteDescription := inputs[1].String()

	exp.SetLocalDescription(localDescription)
	exp.SetRemoteDescription(remoteDescription)

	out, err := json.Marshal(exp.Explain())
	if err != nil {
		panic(err) //nolint:forbidigo
	}

	return string(out)
}

func main() {
	exp = explainer.NewPeerConnectionExplainer()

	js.Global().Set("explain", js.FuncOf(explain))

	select {}
}
