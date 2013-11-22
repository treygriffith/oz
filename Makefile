SRC = $(wildcard lib/*.js)

build: components $(SRC)
        @component build --dev

oz: components
        @component build --standalone oz --name oz --out .

components: component.json
        @component install --dev

clean:
        rm -fr build components template.js

test: build
        open test/index.html

.PHONY: clean oz test