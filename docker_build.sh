rm -rf ./.build
#docker build -t mangoweb/boost .

docker build -t mangoweb/boost . && docker push mangoweb/boost:latest
#cd ./MongoDb/ && docker build -t mangoweb/boost-mongo . && docker push mangoweb/boost-mongo:latest