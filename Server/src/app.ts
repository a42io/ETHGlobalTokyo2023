import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { getUserOpHash } from "@account-abstraction/utils";

import { getSimpleAccount, getGasFee, printOp, getHttpRpcClient } from "./util";

const BUNDLER_URL = process.env.BUNDLER_URL!;

const ACCOUNT_ABI = ["function nonce() view returns (uint256)"];

const FACTORY_ABI = [
  "function getAddress(bytes, uint256) view returns (address)",
];
const ENTRY_POINT = "0x0576a174D229E3cFA37253523E645A78A0C91B57";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app: express.Express = express();

const provider = new ethers.providers.AlchemyProvider(
  process.env.CHAIN_ID,
  process.env.MATIC_ALCHEMY_API_KEY
);

const factoryContract = new ethers.Contract(
  process.env.FACTORY_CONTRACT_ADDRESS!,
  FACTORY_ABI,
  provider
);

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const accountAPI = getSimpleAccount(
  provider,
  wallet.privateKey,
  ENTRY_POINT,
  process.env.FACTORY_CONTRACT_ADDRESS!,
  undefined
);

function getSalt() {
  return ethers.BigNumber.from(ethers.utils.formatBytes32String("a42"));
}

async function getAccountAddress(modulus: string): Promise<string> {
  const a42 = getSalt();
  const wa = await factoryContract.getAddress(modulus, a42);
  return wa as string;
}

async function getInitCode(modulus: string) {
  const a42 = getSalt();
  const code = await provider.getCode(getAccountAddress(modulus));
  const isDeployed = code !== "0x";

  if (!isDeployed) {
    const inf = new ethers.utils.Interface([
      "function createAccount(bytes,uint256)",
    ]);
    return ethers.utils.hexConcat([
      factoryContract.address,
      inf.encodeFunctionData("createAccount", [modulus, a42]),
    ]);
  }
  return "0x";
}

async function getNonce(modulus: string): Promise<string> {
  const address = await getAccountAddress(modulus);
  const code = await provider.getCode(address);

  const isDeployed = code !== "0x";

  if (isDeployed) {
    const w = new ethers.Contract(address, ACCOUNT_ABI, provider);
    const nonce = await w.nonce();
    return nonce;
  } else {
    return "0x0";
  }
}

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
  const salt = getSalt();

  const ca = await factoryContract.getAddress(modulus, salt);

  const code = await provider.getCode(ca);

  res.json({ ca, isDeployed: code !== "0x" });
  return;
});

app.get("/nonce", async (req, res) => {
  const { ca } = req.query;

  if (!ca || !ethers.utils.isAddress(ca as string)) {
    return res.status(400).send("Missing parameters");
  }

  try {
    const contract = new ethers.Contract(ca as string, ACCOUNT_ABI, provider);
    const nonce = await contract.nonce();
    return res.json({ nonce: nonce.toString() });
  } catch (e) {
    console.log(e);
    return res.json({ nonce: "0" });
  }
});

app.get("/balance", async (req, res) => {
  const { ca } = req.query;

  if (!ca || !ethers.utils.isAddress(ca as string)) {
    return res.status(400).send("Missing parameters");
  }

  try {
    const ethBalance = await provider.getBalance(ca as string);
    return res.json({ balance: ethBalance.toString() });
  } catch (e) {
    return res.status(400).send(e);
  }
});

app.get("/uo", async (req, res) => {
  // t 0x...
  // amt 0.001
  const { t, amt, modulus } = req.query;

  const target = ethers.utils.getAddress(t as string);
  const value = ethers.utils.parseEther(amt as string);
  const particial = {
    target,
    value,
    data: "0x",
    ...(await getGasFee(provider)),
  };

  const { callData, callGasLimit } =
    await accountAPI.encodeUserOpCallDataAndGasLimit(particial);

  const initCode = await getInitCode(modulus as string);

  const feeData = await provider.getFeeData();

  const sender = await getAccountAddress(modulus as string);

  const nonce = await getNonce(modulus as string);

  // TODO
  const verificationGasLimit = ethers.BigNumber.from("0xF4240");

  const partialUserOp = {
    sender,
    nonce,
    initCode,
    callData,
    callGasLimit,
    verificationGasLimit,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    paymasterAndData: "0x",
  };

  // const preVerificationGas = await accountAPI.getPreVerificationGas(
  //   partialUserOp as any
  // );

  // TODO
  const preVerificationGas = 100000;

  const unsignedUserOps = {
    ...partialUserOp,
    preVerificationGas,
    signature: "",
  };

  const chainId = await provider.getNetwork().then((net) => net.chainId);
  const prop = await ethers.utils.resolveProperties(unsignedUserOps);
  const userOpHash = await getUserOpHash(prop as any, ENTRY_POINT, chainId);
  const sha256UserOpHash = ethers.utils.sha256(userOpHash);
  const printedOp = await printOp(unsignedUserOps as any);
  const response = { userOpHash: sha256UserOpHash, uop: printedOp };

  return res.json(response);
});

app.post("/transfer", async (req, res) => {
  const uo = req.body;

  const client = await getHttpRpcClient(provider, BUNDLER_URL, ENTRY_POINT);

  try {
    const uoHash = await client.sendUserOpToBundler(uo as any);
    console.log(`UserOpHash: ${uoHash}`);
    console.log("Waiting for transaction...");
    const txHash = await accountAPI.getUserOpReceipt(uoHash);
    console.log(`Transaction hash: ${txHash}`);
    return res.json({ txHash, uoHash });
  } catch (e) {
    console.log(e);
    return res.status(400).send(e);
  }
});

export default app;
