import { Hex, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import { polygonMumbai } from "viem/chains";
import { createSmartWalletClient } from "@biconomy/account";
import config from "../config.json";

export const getAddress = async () => {
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
  const biconomySmartAccount = await createSmartWalletClient({
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    signer: client,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
  });
  const scwAddress = await biconomySmartAccount.getAccountAddress();
  console.log("SCW Address", scwAddress);
};