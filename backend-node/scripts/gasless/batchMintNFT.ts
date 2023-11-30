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

export const batchMintNft = async () => {
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

  // passing accountIndex is optional, by default it will be 0. You may use different indexes for generating multiple counterfactual smart accounts for the same user
  const biconomySmartAccount = await biconomyAccount.init({
    accountIndex: config.accountIndex,
  });

  // ------------------------STEP 2: Build Partial User op from your user Transaction/s Request --------------------------------//

  // generate mintNft data
  const nftInterface = new ethers.utils.Interface([
    "function safeMint(address _to)",
  ]);

  // passing accountIndex is optional, by default it will be 0
  // it should match with the index used to initialise the SDK Biconomy Smart Account instance
  const scwAddress = await biconomySmartAccount.getSmartAccountAddress(
    config.accountIndex
  );

  // Here we are minting NFT to smart account address itself
  const data = nftInterface.encodeFunctionData("safeMint", [scwAddress]);

  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"; // Todo // use from config
  const transaction = {
    to: nftAddress,
    data: data,
  };

  // build partial userOp
  let partialUserOp = await biconomySmartAccount.buildUserOp(
    [transaction, transaction],
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
    const txHash = await userOpResponse.waitForTxHash();
    console.log(
      chalk.blue(`transactionDetails: ${JSON.stringify(txHash, null, "\t")}`)
    );
  } catch (e) {
    console.log("error received ", e);
  }
};
