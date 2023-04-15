init:
	npm i
	gcloud config set project playground-hiro
	gcloud auth configure-docker
	gcloud config set run/platform managed
	gcloud config set run/region us-west1

build:
	docker build --platform linux/amd64 -t playground-hiro/ethglobaltokyo .


tag:
	docker tag playground-hiro/ethglobaltokyo:latest gcr.io/playground-hiro/ethglobaltokyo


push:
	docker push gcr.io/playground-hiro/ethglobaltokyo


deploy:
	gcloud run deploy eth-global-tokyo-api --image gcr.io/playground-hiro/ethglobaltokyo --platform managed --region us-west1 \
   	--update-env-vars FACTORY_CONTRACT_ADDRESS=0x59106245A23aD76a593882C35773C999B3aFbf1C \
	--update-env-vars CHAIN_ID=matic,NODE_ENV=production,NFT_CONTRACT_ADDRESS=0xb172aed64b804325d52e4bbb4d24559b12cb433b \
	--update-secrets GOERLI_ALCHEMY_API_KEY=GOERLI_ALCHEMY_API_KEY:latest,PRIVATE_KEY=PRIVATE_KEY:latest \
	--update-secrets MATIC_ALCHEMY_API_KEY=MATIC_ALCHEMY_API_KEY:latest

go:
	make build
	make tag
	make push
	make deploy
