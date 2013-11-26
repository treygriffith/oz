SRC = $(wildcard lib/*.js)

build: components $(SRC)
				@component build --dev

dist: components
				@component build --standalone oz --name oz --out dist
				@uglifyjs dist/oz.js -o dist/oz.min.js_
				@cp dist/oz.min.js_ dist/oz.min.js
				@gzip dist/oz.min.js
				@mv dist/oz.min.js_ dist/oz.min.js

components: component.json
				@component install --dev

clean:
				rm -fr build components template.js dist

test: build
				open test/index.html

.PHONY: clean oz test