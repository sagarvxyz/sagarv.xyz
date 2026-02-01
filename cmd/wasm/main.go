//go:build js && wasm

package main

import (
	"github.com/sagarvxyz/sagarv.xyz/pkg/markdown"
)

func main() {
	markdown.RegisterJS()
	select {} // keep alive
}
