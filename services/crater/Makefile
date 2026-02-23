APP = crater
SRC = src/crater.cr

.PHONY: all build release run test clean deps

all: build

## Install Crystal dependencies
deps:
	shards install

## Build debug binary
build: deps
	crystal build $(SRC) -o $(APP)

## Build optimized release binary
release: deps
	crystal build $(SRC) -o $(APP) --release

## Run development server
run: deps
	crystal run $(SRC)

## Run tests
test: deps
	crystal spec

## Clean build artifacts
clean:
	rm -f $(APP)
	rm -rf .crystal/

## Format source files
fmt:
	crystal tool format src/

## Check formatting without modifying
fmt-check:
	crystal tool format --check src/

## Show help
help:
	@echo "Available targets:"
	@echo "  deps        Install Crystal shards"
	@echo "  build       Build debug binary"
	@echo "  release     Build release binary"
	@echo "  run         Run in development mode"
	@echo "  test        Run test suite"
	@echo "  clean       Remove build artifacts"
	@echo "  fmt         Format source code"
	@echo "  fmt-check   Check formatting"
