package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"

	"github.com/spf13/cobra"
)

var (
	ErrConfNotFound = RouteGenErr{"Config not found, must create routegen.json"}
	ErrConfFormat   = RouteGenErr{"Wrong config format"}
)

type Config struct {
	HandlersDir string `json:"handlers_dir"`
	OutPath     string `json:"out_path"`
}
type RouteGenErr struct {
	Msg string
}

func (e RouteGenErr) Error() string {
	return e.Msg
}

func loadConfig() (Config, error) {

	cfg := Config{}

	file, err := os.ReadFile("routegen.json")
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return Config{}, ErrConfNotFound
		}
		return Config{}, err
	}

	err = json.Unmarshal(file, &cfg)
	if err != nil {
		return Config{}, ErrConfFormat
	}

	return cfg, nil
}

func main() {

	var handlerDir string
	var outputPath string
	var watchMode bool

	rootCmd := &cobra.Command{
		Use:     "route-gen",
		Version: "1.0.2",
		Short:   "Scrapes Go backend handlers to generate TypeScript API routes",
		Long:    "A CLI tool that parses Go abstract syntax trees (AST) in the backend handlers directory to extract defined HTTP routes, then auto-generates a corresponding TypeScript constants file for the frontend.",
		Run: func(cmd *cobra.Command, args []string) {

			if handlerDir == "" || outputPath == "" {
				cfg, err := loadConfig()

				if err != nil {
					log.Fatalf("\033[1;31m  ✘ Load Config failed:\033[0m %v\n", err)
				}
				handlerDir = cfg.HandlersDir
				outputPath = cfg.OutPath

			}
			generateRoutes(handlerDir, outputPath)

			if watchMode {
				startWatcher(handlerDir, outputPath)
			}
		},
	}

	rootCmd.Flags().StringVarP(&handlerDir, "dir", "d", "", "Path to the backend handlers directory")
	rootCmd.Flags().StringVarP(&outputPath, "out", "o", "", "Path to the output TypeScript file")
	rootCmd.Flags().BoolVarP(&watchMode, "watch", "w", false, "Watch the handlers directory for changes and auto-regenerate")

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
