import { ethers } from "ethers";
const { ERC20ABI } = require("../abi");
import chalk from "chalk";
import {
  BiconomySmartAccount,
  DEFAULT_ENTRYPOINT_ADDRESS,
} from "@biconomy/account";
import { Bundler } from "@biconomy/bundler";
import { BiconomyPaymaster } from "@biconomy/paymaster";
import {
  IHybridPaymaster,
  PaymasterMode,
  SponsorUserOperationDto,
} from "@biconomy/paymaster";
import config from "../../config.json";

export const erc20Transfer = async (
  recipientAddress: string,
  amount: number,
  tokenAddress: string
) => {
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

  // In this script we're going to make use of strictMode flag in the paymaster

  // by default is true.
  // If set to false, and if your policies fail (token address that is not registered on the dashboard in this case)
  // then paymaster and data is still sent as 0x and account will pay in native
  // Note: that your smart account needs have some native token for this kind of fallback otherwise you will receive AA21 error

  const paymaster = new BiconomyPaymaster({
    paymasterUrl: config.biconomyPaymasterUrl,
    strictMode: false,
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

  // passing accountIndex is optional, by default it will be 0. You may use different indexes for generating multiple counterfactual smart accounts for the same user
  const biconomySmartAccount = await biconomyAccount.init({
    accountIndex: config.accountIndex,
  });

  // ------------------------STEP 2: Build Partial User op from your user Transaction/s Request --------------------------------//

  // Transfer ERC20
  // Please note that for sponsorship, policies have to be added on the Biconomy dashboard https://dashboard.biconomy.io/
  // in this case it will be whitelisting token contract and method transfer()

  // 1. for native token transfer no policy is required. you may add a webhook to have custom control over this
  // 2. If no policies are added every transaction will be sponsored by your paymaster
  // 3. If you add policies, then only transactions that match the policy will be sponsored by your paymaster - (if optional strictMode is not false in paymaster config)

  // generate ERC20 transfer data
  // Encode an ERC-20 token transfer to recipient of the specified amount
  const readProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ERC20ABI,
    readProvider
  );
  let decimals = 18;
  try {
    decimals = await tokenContract.decimals();
  } catch (error) {
    throw new Error("invalid token address supplied");
  }
  const amountGwei = ethers.utils.parseUnits(amount.toString(), decimals);
  const data = (
    await tokenContract.populateTransaction.transfer(
      recipientAddress,
      amountGwei
    )
  ).data;
  const transaction = {
    to: tokenAddress,
    data,
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

  console.log(
    chalk.blue(`userOp: ${JSON.stringify(partialUserOp, null, "\t")}`)
  );

  try {
    const userOpResponse = await biconomySmartAccount.sendUserOp(partialUserOp);
    console.log(chalk.green(`userOp Hash: ${userOpResponse.userOpHash}`));
    const transactionDetails = await userOpResponse.wait();
    console.log(
      chalk.blue(
        `transactionDetails: ${JSON.stringify(transactionDetails, null, "\t")}`
      )
    );
  } catch (e) {
    console.log("error received ", e);
  }
};
