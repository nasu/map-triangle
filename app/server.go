package app

import (
	"html/template"
	"io"
	"net/http"

	"github.com/labstack/echo"
)

const API_KEY = "rewrite"

var e = createMux()

type Template struct {
	templates *template.Template
}

func (t *Template) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func init() {
	t := &Template{
		//TODO: go run するパスで指定する必要ある。イケてない
		//templates: template.Must(template.ParseGlob("public/html/*.html")),
		// standalone用
		templates: template.Must(template.ParseGlob("app/public/html/*.html")),
	}
	e.Renderer = t
	//TODO: go run するパスで指定する必要ある。イケてない
	//e.Static("/js", "public/js")
	//e.Static("/css", "public/css")
	// standalone用
	e.Static("/js", "app/public/js")
	e.Static("/css", "app/public/css")
	e.GET("/", Index)
}

func Index(c echo.Context) error {
	return c.Render(http.StatusOK, "index.html", API_KEY)
}
