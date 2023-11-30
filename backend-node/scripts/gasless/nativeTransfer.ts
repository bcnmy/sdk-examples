import { ethers } from "ethers";
import chalk from "chalk";
import {
  BiconomySmartAccount,
  DEFAULT_ENTRYPOINT_ADDRESS,
} from "@biconomy/account";
import { Bundler } from "@biconomy/bundler";
import { BiconomyPaymaster } from "@biconomy/paymaster";
import { PaymasterMode } from "@biconomy/paymaster";
import config from "../../config.json";

export const nativeTransfer = async (to: string, amount: number) => {
  // ------------------------STEP 1: Initialise Biconomy Smart Account SDK--------------------------------//

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

  // Biconomy smart account config
  // Note that paymaster and bundler are optional. You can choose to create new instances of this later and make account API use
  const biconomySmartAccountConfig = {
    signer: signer,
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    paymaster: paymaster,
    bundler: bundler,
  };

  // create biconomy smart account instance
  const biconomyAccount = new BiconomySmartAccount(biconomySmartAccountConfig);
  const biconomySmartAccount = await biconomyAccount.init({
    accountIndex: config.accountIndex,
  });

  const transaction = {
    to: to || "0x0000000000000000000000000000000000000000",
    data: "0x",
    value: ethers.utils.parseEther(amount.toString()),
  };

  // build partial userOp
  let partialUserOp = await biconomySmartAccount.buildUserOp(
    [transaction],
    {},
    true,
    {
      mode: PaymasterMode.SPONSORED,
      smartAccountInfo: {
        name: "BICONOMY",
        version: "1.0.0",
      },
    }
  );

  try {
    const userOpResponse = await biconomySmartAccount.sendUserOp(partialUserOp);
    console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
    const txHash = await userOpResponse.waitForTxHash();
    console.log(
      chalk.blue(`transactionDetails: ${JSON.stringify(txHash, null, "\t")}`)
    );
  } catch (e) {
    console.log("error received ", e);
  }
};
