REPO = liveui
IMAGE = boost
TAG = latest

build:
	docker build -t $(REPO)/$(IMAGE):$(TAG) .

run:
	docker-compose up

clean:
	./scripts/docker-shortcuts/kill-all.sh
	./scripts/docker-shortcuts/upgrade-images.sh 

publish: build
	docker tag $(REPO)/$(IMAGE):$(TAG) $(REPO)/$(IMAGE):latest
	docker push $(REPO)/$(IMAGE):$(TAG)
	docker push $(REPO)/$(IMAGE):latest
