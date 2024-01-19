# node

node has two hardcoded SessionDescriptions and prints out the results from `explain`

## Instructions
You can download the WASM build and `wasm_exec.js` from master build OR build yourself.

### Download from `pe.pion.ly`
* `wget https://pe.pion.ly/wasm.wasm`
* `wget https://pe.pion.ly/wasm_exec.js`

### Build
* Copy `wasm_exec.js`: `cp "$(go env GOROOT)/misc/wasm/wasm_exec_node.js" .`
* Build - `GOOS=js GOARCH=wasm go build -o wasm.wasm ../../pkg/wasm`

### Run
Run `node main.js`
