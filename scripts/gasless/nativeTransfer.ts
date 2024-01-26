import { Hex, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import { polygonMumbai } from "viem/chains";
import { createSmartAccountClient, PaymasterMode } from "@biconomy/account";
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
  const smartAccount = await createSmartAccountClient({
    signer: client,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
  });
  const scwAddress = await smartAccount.getAccountAddress();
  console.log("SCW Address", scwAddress);

  // ------ 3. Generate transaction data
  const txData = {
    to,
    value: parseEther(amount.toString()),
  };

  // ------ 4. Send user operation and get tx hash
  const { waitForTxHash } = await smartAccount.sendTransaction(txData, {
    paymasterServiceData: { mode: PaymasterMode.SPONSORED },
  });
  const { transactionHash } = await waitForTxHash();
  console.log("transactionHash", transactionHash);
};
