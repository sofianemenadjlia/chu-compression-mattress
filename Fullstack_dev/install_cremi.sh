#!/bin/sh

export PATH=/opt/users/Node.js/bin:$PATH
cd backend;
npm install &
cd ../client &&
npm install