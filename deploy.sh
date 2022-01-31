export NODE_ENV=development
echo $1
echo "Kill the running PM2 actions"
pm2 delete $1

echo "Jump to app folder"
cd "$1"
echo "Cleaning  Up with Git Checkout"
git checkout .

echo "Update app from Git"
git pull

echo "Install app dependencies"
yarn

echo "Build your app"
yarn build

echo "Run new PM2 action"
pm2 start dist/src/server.js --name $1 