package ssg

import (
	"github.com/sagarvxyz/sagarv.xyz/pkg/markdown"
	"github.com/sagarvxyz/sagarv.xyz/pkg/router"
)

// Build generates the static site.
func Build() {
	_ = markdown.Parse
	_ = router.New
}
