package router

// Router handles URL routing for the static site.
type Router struct {
	routes map[string]string
}

// New creates a new Router.
func New() *Router {
	return &Router{
		routes: make(map[string]string),
	}
}
