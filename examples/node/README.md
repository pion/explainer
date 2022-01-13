# node

node has two hardcoded SessionDescriptions and prints out the results from `explain`

## Instructions
You can download the WASM build and `wasm_exec.js` from master build OR build yourself.

### Download from `pe.pion.ly`
* `wget https://pe.pion.ly/wasm.wasm`
* `wget https://pe.pion.ly/wasm_exec.js`

### Build
* [Install TinyGo](https://tinygo.org/getting-started/install/)
* Copy wasm_exec - `cp $(tinygo env TINYGOROOT)/targets/wasm_exec.js .`
* Build - `tinygo build -o wasm.wasm -target wasm  -no-debug --panic trap github.com/pion/explainer/pkg/wasm`

### Run
Run `node main.js`
