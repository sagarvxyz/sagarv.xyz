package main

import (
	"fmt"

	"github.com/sagarvxyz/sagarv.xyz/pkg/ssg"
)

func main() {
	fmt.Println("Building site...")
	ssg.Build()
}
