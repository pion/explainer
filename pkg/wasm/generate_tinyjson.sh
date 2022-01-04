#!/bin/bash

cd ../..

for i in "sessiondescription" "result"; do
   tinyjson -all "$i".go
   sed -i -n -e :a -e '1,23!{P;N;D;};N;ba' ./"$i"_tinyjson.go
done

cd pkg/wasm
mv ../../*_tinyjson.go .
sed -i 's/package explainer/package main/g' *_tinyjson.go
