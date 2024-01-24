import { Hex, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import { polygonMumbai } from "viem/chains";
import {
  createSmartAccountClient,
  PaymasterMode,
} from "@biconomy/account";
import config from "../../config.json";

export const nativeTransfer = async (to: string, amount: number) => {
  // ----- 1. Generate EOA from private key
  const account = privateKeyToAccount(config.privateKey as Hex);
  const client = createWalletClient({
    account,
    chain: polygonMumbai,
    transport: http(),
  });
  const eoa = client.account.address;
  console.log(chalk.blue(`EOA address: ${eoa}`));

  // ------ 2. Create biconomy smart account instance
  const smartWallet = await createSmartAccountClient({
    signer: client,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
  });
  const scwAddress = await smartWallet.getAccountAddress();
  console.log("SCW Address", scwAddress);

  // ------ 3. Generate transaction data
  const txData = {
    to,
    value: parseEther(amount.toString()),
  };

  // ------ 4. Build user operation
  const userOp = await smartWallet.buildUserOp([txData], {
    paymasterServiceData: {
      mode: PaymasterMode.SPONSORED,
    }
  });
  console.log("userOp", userOp);

  // ------ 5. Send user operation and get tx hash
  const tx = await smartWallet.sendUserOp(userOp);
  const { transactionHash } = await tx.waitForTxHash();
  console.log("transactionHash", transactionHash);
};
