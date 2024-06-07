#!/bin/sh

cd backend;
node server &
cd ../client &&
npm run serve