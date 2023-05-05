// SPDX-FileCopyrightText: 2023 The Pion community <https://pion.ly>
// SPDX-License-Identifier: MIT

// Package main implements a little CLI example
package main

import (
	"encoding/json"
	"os"

	"github.com/disgoorg/log"
	"github.com/pion/explainer"
)

const (
	remoteDescription = `{"type": "offer", "sdp": "v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nc=IN IP4 127.0.0.1\r\nt=0 0\r\nm=audio 4000 RTP/AVP 111\r\na=rtpmap:111 OPUS/48000/2\r\nm=video 4002 RTP/AVP 96\r\na=rtpmap:96 VP8/90000"}`
	localDescription  = `{"type": "answer", "sdp": "v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nc=IN IP4 127.0.0.1\r\nt=0 0\r\nm=audio 4000 RTP/AVP 111\r\na=rtpmap:111 OPUS/48000/2\r\nm=video 4002 RTP/AVP 96\r\na=rtpmap:96 VP8/90000"}`
)

func main() {
	e := explainer.NewPeerConnectionExplainer()

	e.SetRemoteDescription(remoteDescription)
	e.SetLocalDescription(localDescription)

	results, err := json.MarshalIndent(e.Explain(), "", "  ")
	if err != nil {
		log.Panic(err)
	}

	if _, err := os.Stdout.Write(results); err != nil {
		log.Error(err)
	}
}
