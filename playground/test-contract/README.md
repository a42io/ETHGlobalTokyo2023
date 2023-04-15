```bash
source .env
forge script script/Deploy.s.sol:DeployScript --broadcast --rpc-url ${MATIC_RPC_URL} --verify --etherscan-api-key ${ETHERSCAN_API_KEY}
```
