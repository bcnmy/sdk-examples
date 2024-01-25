import {
  Hex,
  createWalletClient,
  encodeFunctionData,
  http,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import { polygonMumbai } from "viem/chains";
import { createSmartAccountClient } from "@biconomy-devx/account";
import { createMultiChainValidationModule } from "@biconomy-devx/modules";
import config from "../../config.json";

export const multiChainMint = async () => {
  // ----- 1. Generate EOA from private key
  const account = privateKeyToAccount(config.privateKey as Hex);
  const client = createWalletClient({
    account,
    chain: polygonMumbai,
    transport: http(),
  });
  const eoa = client.account.address;
  console.log(chalk.blue(`EOA address: ${eoa}`));

  // ------ 2. Create module and biconomy smart account instance
  const multiChainModule = await createMultiChainValidationModule({
    signer: client,
  });
  const smartWallet1 = await createSmartAccountClient({
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
    defaultValidationModule: multiChainModule,
  });
  const scwAddress1 = await smartWallet1.getAccountAddress();
  console.log("SCW Address 1", scwAddress1);

  const smartWallet2 = await createSmartAccountClient({
    chainId: 97,
    rpcUrl: "https://data-seed-prebsc-1-s2.binance.org:8545",
    signer: client,
    bundlerUrl:
      "https://bundler.biconomy.io/api/v2/97/A5CBjLqSc.0dcbc53e-anPe-44c7-b22d-21071345f76a",
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
    defaultValidationModule: multiChainModule,
  });
  const scwAddress2 = await smartWallet2.getAccountAddress();
  console.log("SCW Address 1", scwAddress2);

  // ------ 3. Generate transaction data
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
  const parsedAbi = parseAbi(["function safeMint(address _to)"]);
  const nftData1 = encodeFunctionData({
    abi: parsedAbi,
    functionName: "safeMint",
    args: [scwAddress1 as Hex],
  });
  const nftData2 = encodeFunctionData({
    abi: parsedAbi,
    functionName: "safeMint",
    args: [scwAddress2 as Hex],
  });

  // ------ 4. Build user operation
  let userOp1 = await smartWallet1.buildUserOp([
    {
      to: nftAddress,
      data: nftData1,
    },
  ]);
  let userOp2 = await smartWallet1.buildUserOp([
    {
      to: nftAddress,
      data: nftData2,
    },
  ]);
  const returnedOps = await multiChainModule.signUserOps([
    { userOp: userOp1, chainId: 80001 },
    { userOp: userOp2, chainId: 97 },
  ]);
  console.log("both returned ops", returnedOps);

  try {
    const tx = await smartWallet1.sendSignedUserOp(returnedOps[0]);
    const { transactionHash } = await tx.waitForTxHash();
    console.log("transactionHash1", transactionHash);
  } catch (e) {
    console.log("error received ", e);
  }

  try {
    const tx = await smartWallet2.sendSignedUserOp(returnedOps[1]);
    const { transactionHash } = await tx.waitForTxHash();
    console.log("transactionHash2", transactionHash);
  } catch (e) {
    console.log("error received ", e);
  }
};
