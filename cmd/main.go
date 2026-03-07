package main

import (
	"fmt"
	"strings"
)

func main() {
	s := strings.Split("/intakes/{intakeId}/sections", "/")
	fmt.Printf("%s\n", s[0])

}
