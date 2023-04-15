import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import axios from "axios";

const ENTRY_POINT = "0x0576a174D229E3cFA37253523E645A78A0C91B57";

const EXPONENT =
  "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010001";

const FACTORY_ABI = [
  "function getAddr(address,bytes,bytes,uint256) view returns (address)",
  "function createAccount(address,bytes,bytes,bytes32) returns (address)",
];

const WALLET_ABI = [
  "function nonce() view returns (uint256)",
  "function transfer(address,uint256,bytes) returns (bool)",
  "function getBalance() view returns (uint256)",
];

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app: express.Express = express();

const provider = new ethers.AlchemyProvider(
  process.env.CHAIN_ID,
  process.env.MATIC_ALCHEMY_API_KEY
);

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const factoryContract = new ethers.Contract(
  process.env.FACTORY_CONTRACT_ADDRESS!,
  FACTORY_ABI,
  wallet
);

app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  console.log("Request URL:", req.originalUrl);
  console.log("Request Type:", req.method);
  console.log("Request Header: ", JSON.stringify(req.headers));
  console.log("Request Body: ", JSON.stringify(req.body));
  next();
});

app.get("/", (_req, res) => {
  res.send("Hello World!");
});

app.get("/ca", async (req, res) => {
  const { modulus } = req.query;
  if (!modulus) {
    res.status(400).send("Missing parameters");
    return;
  }

  // 42
  const salt = ethers.keccak256(ethers.hexlify("0x2a"));

  const ca = await factoryContract.getAddr(
    ENTRY_POINT,
    modulus,
    EXPONENT,
    salt
  );

  const code = await provider.getCode(ca);

  res.json({ ca, isDeployed: code !== "0x" });
  return;
});

app.get("/nonce", async (req, res) => {
  const { ca } = req.query;

  if (!ca || !ethers.isAddress(ca as string)) {
    return res.status(400).send("Missing parameters");
  }

  try {
    const contract = new ethers.Contract(ca as string, WALLET_ABI, provider);
    const nonce = await contract.nonce();
    return res.json({ nonce: nonce.toString() });
  } catch (e) {
    console.log(e);
    return res.json({ nonce: "0" });
  }
});

app.get("/balance", async (req, res) => {
  const { ca } = req.query;

  if (!ca || !ethers.isAddress(ca as string)) {
    return res.status(400).send("Missing parameters");
  }

  try {
    const ethBalance = await provider.getBalance(ca as string);
    return res.json({ balance: ethBalance.toString() });
  } catch (e) {
    return res.status(400).send(e);
  }
});

app.get("/nft", async (req, res) => {
  const { ca } = req.query;

  if (!ca || !ethers.isAddress(ca as string)) {
    return res.status(400).send("Missing parameters");
  }

  try {
    const { data } = await axios.get(
      `https://polygon-mainnet.g.alchemy.com/nft/v2/${process.env.MATIC_ALCHEMY_API_KEY}/getNFTs?owner=${ca}`
    );

    const nfts = data.ownedNfts.map((nft: any) => {
      return {
        title: nft.title,
        name: nft.name,
        description: nft.description,
        contract: nft.contract.address,
        tokenId: nft.id.tokenId,
        thumbnail: nft.media?.map(
          (r: { thumbnail?: string }) => r.thumbnail
        )?.[0],
      };
    });

    return res.json(nfts);
  } catch (e) {
    console.log({ e });
    return res.status(400).send(e);
  }
});

export default app;
