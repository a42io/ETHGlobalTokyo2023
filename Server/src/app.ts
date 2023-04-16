import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { getUserOpHash } from "@account-abstraction/utils";

import {
  // getVerifyingPaymaster,
  getSimpleAccount,
  getGasFee,
  printOp,
  // getHttpRpcClient,
} from "./util";

// const BUNDLER_URL =
process.env.BUNDLER ||
  "https://node.stackup.sh/v1/rpc/38e06004797c105d144d11e68f406f10dae0dee82faf6304920d3afeccc002e0";

const ACOUNT_ABI = ["function nonce() view returns (uint256)"];

const FACTORY_ABI = [
  "function getAddress(bytes, uint256) view returns (address)",
];
const ENTRY_POINT = "0x0576a174D229E3cFA37253523E645A78A0C91B57";

// const EXPONENT =
("0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010001");

const WALLET_ABI = ["function nonce() view returns (uint256)"];

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

function getSalt() {
  return ethers.BigNumber.from(ethers.utils.formatBytes32String("a42"));
}

async function getAccountAddress(modulus: string): Promise<string> {
  const a42 = getSalt();
  const wa = await factoryContract.getAddress(modulus, a42);
  console.log("wallet address: ", wa);
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
    const w = new ethers.Contract(address, ACOUNT_ABI, provider);
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
  const salt = ethers.BigNumber.from(ethers.utils.formatBytes32String("a42"));

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

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const accountAPI = getSimpleAccount(
    provider,
    wallet.privateKey,
    ENTRY_POINT,
    process.env.FACTORY_CONTRACT_ADDRESS!,
    undefined
  );

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

  const verificationGasLimit = ethers.BigNumber.from("0xF4240");

  const partialUserOp = {
    sender,
    nonce: ethers.BigNumber.from(nonce),
    initCode,
    callData,
    callGasLimit,
    verificationGasLimit,
    preVerificationGas: ethers.BigNumber.from("0x00"),
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    paymasterAndData: "0x",
    signature: "0x00",
  };

  const preVerificationGas = await accountAPI.getPreVerificationGas(
    partialUserOp as any
  );

  const without = {
    callData,
    callGasLimit,
    sender,
    initCode,
    nonce,
    verificationGasLimit,
    maxFeePerGas: feeData.maxFeePerGas!,
    maxPriorityFeePerGas: feeData.maxFeePerGas!,
    preVerificationGas,
  };

  const hoges = {
    ...particial,
    ...without,
    paymasterAndData: "0x",
  };

  console.log("------");
  console.log(hoges);

  const chainId = await provider.getNetwork().then((net) => net.chainId);

  const uo2 = {
    sender,
    nonce,
    initCode,
    callData,
    callGasLimit,
    verificationGasLimit,
    maxFeePerGas: feeData.maxFeePerGas!,
    maxPriorityFeePerGas: feeData.maxFeePerGas!,
    paymasterAndData: "0x",
    preVerificationGas,
  };

  const prop = await ethers.utils.resolveProperties(uo2);

  const userOpHash = await getUserOpHash(prop as any, ENTRY_POINT, chainId);

  console.log(userOpHash);

  const printedOp = await printOp(uo2 as any);

  return res.json({ userOpHash, uop: printedOp });
});

export default app;
