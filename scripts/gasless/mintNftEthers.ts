import { Hex, encodeFunctionData, parseAbi } from "viem";
import { ethers } from "ethers";
const chalk = require("chalk");
import {
  createSmartWalletClient,
  PaymasterMode,
} from "@biconomy/account";
import config from "../../config.json";

export const mintNftEthers = async () => {
  // ----- 1. Generate EOA from private key
  let provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  let signer = new ethers.Wallet(config.privateKey, provider);
  const eoa = await signer.getAddress();
  console.log(chalk.blue(`EOA address: ${eoa}`));

  // ------ 2. Create biconomy smart account instance
  const smartWallet = await createSmartWalletClient({
    signer,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
  });
  console.log("here");
  const scwAddress = await smartWallet.getAccountAddress();
  console.log("SCW Address", scwAddress);

  // ------ 3. Generate transaction data
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
  const parsedAbi = parseAbi(["function safeMint(address _to)"]);
  const nftData = encodeFunctionData({
    abi: parsedAbi,
    functionName: "safeMint",
    args: [scwAddress as Hex],
  });

  // ------ 4. Build user operation
  const tx = {
    to: nftAddress,
    data: nftData,
  };

  // ------ 5. Send user operation and get tx hash
  const userOpResponse = await smartWallet.sendTransaction(tx, {paymasterServiceData: {mode: PaymasterMode.SPONSORED}});
  const { transactionHash } = await userOpResponse.waitForTxHash();
  console.log("transactionHash", transactionHash);
};
