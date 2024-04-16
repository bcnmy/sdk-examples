import { Hex, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import {
  createSmartAccountClient,
  PaymasterMode,
  SupportedSigner,
} from "@biconomy-devx/account";
import config from "../../config.json";
import { getChain } from "../utils/getChain";

export const nativeTransferPayERC20 = async (to: string, amount: number) => {
  // ----- 1. Generate EOA from private key
  const account = privateKeyToAccount(config.privateKey as Hex);
  const client = createWalletClient({
    account,
    chain: getChain(config.chainId),
    transport: http(),
  });
  const eoa = client.account.address;
  console.log(chalk.blue(`EOA address: ${eoa}`));

  // ------ 2. Create biconomy smart account instance
  const smartAccount = await createSmartAccountClient({
    signer: client as SupportedSigner,
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

  // ------ 4. Send tx
  const { waitForTxHash } = await smartAccount.sendTransaction(txData, {
    paymasterServiceData: {
      mode: PaymasterMode.ERC20,
      preferredToken: config.preferredToken,
    },
  });

  const { transactionHash } = await waitForTxHash();
  console.log("transactionHash", transactionHash);
};
