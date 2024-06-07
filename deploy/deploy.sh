printf "Installing backend libraries...\n"

(cd ../Fullstack_dev/backend && npm install)
if [ $? = 0 ]; then
    printf "Backend is ready\n"
else
    exit
fi

printf "Installing frontend libraries and compiling website...\n"
(cd ../Fullstack_dev/client && npm install && npm run build)
if [ $? = 0 ]; then
    printf "Compilation successful\n"
else
    exit
fi

printf "Installing proxy libraries"
(npm install)
if [ $? = 0 ]; then
    printf "Install successful\n"
else
    exit
fi

printf "Preparing build environment\n"
cp -r ../Fullstack_dev/client/dist .
cp -r ../Fullstack_dev/backend .
mkdir build

printf "Building standalone server\n"
npm run pkg server.js

mv server-linux build/
mv server-macos build/
mv server-win.exe build/
printf "Build done :)\n"