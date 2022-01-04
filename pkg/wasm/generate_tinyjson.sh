#!/bin/bash

cd ../..

for i in "sessiondescription" "result"; do
   tinyjson -all "$i".go
done

cd pkg/wasm
mv ../../*_tinyjson.go .
sed -i 's/package explainer/package main/g' *_tinyjson.go
