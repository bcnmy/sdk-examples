import { ethers } from "ethers";
import chalk from "chalk";
import {
  BiconomySmartAccount,
  DEFAULT_ENTRYPOINT_ADDRESS,
} from "@biconomy-devx/account";
import { Bundler } from "@biconomy-devx/bundler";
import { BiconomyPaymaster } from "@biconomy-devx/paymaster";
import { Transaction, UserOperation } from "@biconomy-devx/core-types";
import config from "../config.json";

async function createBiconomyAccountInstance() {
  // get EOA address from wallet provider
  let provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  let signer = new ethers.Wallet(config.privateKey, provider);
  const eoa = await signer.getAddress();
  console.log(chalk.blue(`EOA address: ${eoa}`));

  // create bundler and paymaster instances
  const bundler = new Bundler({
    bundlerUrl: config.bundlerUrl,
    chainId: config.chainId,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
  });
  const paymaster = new BiconomyPaymaster({
    paymasterUrl: config.biconomyPaymasterUrl,
  });

  // create biconomy smart account instance
  const biconomySmartAccountConfig = {
    signer: signer,
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    paymaster: paymaster,
    bundler: bundler,
  };
  const biconomyAccount = new BiconomySmartAccount(biconomySmartAccountConfig);
  const biconomySmartAccount = await biconomyAccount.init();
  return biconomySmartAccount;
}

async function sendUserOp(
  biconomySmartAccount: BiconomySmartAccount,
  userOp: Partial<UserOperation>
) {
  console.log(chalk.blue(`userOp: ${JSON.stringify(userOp, null, "\t")}`));
  const userOpResponse = await biconomySmartAccount.sendUserOp(userOp);
  console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
  const transactionDetails = await userOpResponse.wait();
  console.log(
    chalk.blue(
      `transactionDetails: ${JSON.stringify(transactionDetails, null, "\t")}`
    )
  );
}

export { createBiconomyAccountInstance, sendUserOp };
