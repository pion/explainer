#!/bin/bash

cd ../..

tinyjson -no_std_marshalers -all result.go
cd pkg/wasm
mv ../../*_tinyjson.go .
sed -i 's/package explainer/package main/g' *_tinyjson.go
