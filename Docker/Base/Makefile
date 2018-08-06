REPO = liveui
IMAGE = boost-base
TAG = 1.1.1

build:
	docker build -t $(REPO)/$(IMAGE):$(TAG) .

publish: build
	docker tag $(REPO)/$(IMAGE):$(TAG) $(REPO)/$(IMAGE):latest
	docker push $(REPO)/$(IMAGE):$(TAG)
	docker push $(REPO)/$(IMAGE):latest

test:
	chmod a+x test.sh
	docker run --rm -v $(CURDIR):/src -w /src $(REPO)/$(IMAGE):$(TAG) ./test.sh
