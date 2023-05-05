# web

Web provides a UI that accepts a Remote and Local Description and prints out an analysis.

## Instructions
You can download the WASM build and `wasm_exec.js` from master build OR build yourself.

### Download from `pe.pion.ly`
* `wget https://pe.pion.ly/wasm.wasm`
* `wget https://pe.pion.ly/wasm_exec.js`

### Build
* Copy `wasm_exec.js`: `cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" .`
* Build - `GOOS=js GOARCH=wasm go build -o wasm.wasm ../pkg/wasm`

### Run
You can now run using any HTTP server. If you have Python available `python -m SimpleHTTPServer` is a good option.
You can access at [http://localhost:8000](http://localhost:8000)
