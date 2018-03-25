// +build !appengine
// +build standalone

package app

import (
	"github.com/labstack/echo"
)

func createMux() *echo.Echo {
	e := echo.New()
	return e
}
