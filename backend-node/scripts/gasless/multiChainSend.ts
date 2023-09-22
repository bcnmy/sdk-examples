import { ethers } from "ethers";
const chalk = require('chalk')

import {
    BiconomySmartAccountV2,
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
import { ECDSAOwnershipValidationModule, MultiChainValidationModule, DEFAULT_ECDSA_OWNERSHIP_MODULE, DEFAULT_MULTICHAIN_MODULE } from "@biconomy/modules";

export const multiChainMint = async () => {

  // ------------------------STEP 1: Initialise Biconomy Smart Account SDK--------------------------------//  

  // get EOA address from wallet provider
  let provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  let signer = new ethers.Wallet(config.privateKey, provider);
  const eoa = await signer.getAddress();
  console.log(chalk.blue(`EOA address: ${eoa}`));

  // create bundler and paymaster instances
  const bundler1 = new Bundler({
    bundlerUrl: config.bundlerUrl,
    chainId: config.chainId,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
  });

  const paymaster = new BiconomyPaymaster({
    paymasterUrl: config.biconomyPaymasterUrl
  });

  const multiChainModule = await MultiChainValidationModule.create({
    signer: signer,
    moduleAddress: DEFAULT_MULTICHAIN_MODULE
  })

  // Biconomy smart account config
  // Note that paymaster and bundler are optional. You can choose to create new instances of this later and make account API use 
  const biconomySmartAccountConfig1 = {
    signer: signer,
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    paymaster: paymaster, 
    bundler: bundler1, 
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    defaultValidationModule: multiChainModule,
    activeValidationModule: multiChainModule
  };

  // create biconomy smart account instance
  const biconomySmartAccount1 = await BiconomySmartAccountV2.create(biconomySmartAccountConfig1);

  
  const bundler2 = new Bundler({
    bundlerUrl: "https://bundler.biconomy.io/api/v2/97/A5CBjLqSc.0dcbc53e-anPe-44c7-b22d-21071345f76a",
    chainId: 97,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
  });

  const biconomySmartAccountConfig2 = {
    signer: signer,
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s2.binance.org:8545',
    // paymaster: paymaster, 
    bundler: bundler2, 
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    defaultValidationModule: multiChainModule,
    activeValidationModule: multiChainModule
  };


  // create biconomy smart account instance
  const biconomySmartAccount2 = await BiconomySmartAccountV2.create(biconomySmartAccountConfig2);

  
  // ------------------------STEP 2: Build Partial User op from your user Transaction/s Request --------------------------------//

  
  // mint NFT
  // Please note that for sponsorship, policies have to be added on the Biconomy dashboard https://dashboard.biconomy.io/
  // in this case it will be whitelisting NFT contract and method safeMint()

  // 1. for native token transfer no policy is required. you may add a webhook to have custom control over this
  // 2. If no policies are added every transaction will be sponsored by your paymaster
  // 3. If you add policies, then only transactions that match the policy will be sponsored by your paymaster

  // generate mintNft data
  const nftInterface = new ethers.utils.Interface([
    "function safeMint(address _to)",
  ]);

  const scwAddress1 = await biconomySmartAccount1.getAccountAddress();

  // Here we are minting NFT to smart account address itself
  const data1 = nftInterface.encodeFunctionData("safeMint", [scwAddress1]);

  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"; // Todo // use from config
  const transaction1 = {
    to: nftAddress,
    data: data1,
  };

  // build partial userOp
  let partialUserOp1 = await biconomySmartAccount1.buildUserOp([transaction1]);

  const scwAddress2 = await biconomySmartAccount2.getAccountAddress();

  // Here we are minting NFT to smart account address itself
  const data2 = nftInterface.encodeFunctionData("safeMint", [scwAddress2]);

  const transaction2 = {
    to: nftAddress,
    data: data2,
  };

  let partialUserOp2 = await biconomySmartAccount2.buildUserOp([transaction2]);


  const returnedOps = await multiChainModule.signUserOps([{userOp: partialUserOp1, chainId: 80001}, {userOp: partialUserOp2, chainId: 97}]);

  console.log("both returned ops")
  console.log(returnedOps)




  try{
  const userOpResponse1 = await biconomySmartAccount1.sendSignedUserOp(returnedOps[0] as any);
  console.log(chalk.green(`userOp Hash: ${userOpResponse1.userOpHash}`));
  const transactionDetails1 = await userOpResponse1.wait();
  console.log(
    chalk.blue(
      `transactionDetails: ${JSON.stringify(transactionDetails1, null, "\t")}`
    )
  );
 } catch (e) {
    console.log("error received ", e);
  }


  try{
  const userOpResponse2 = await biconomySmartAccount2.sendSignedUserOp(returnedOps[1] as any);
  console.log(chalk.green(`userOp Hash: ${userOpResponse2.userOpHash}`));
  const transactionDetails2 = await userOpResponse2.wait();
  console.log(
    chalk.blue(
      `transactionDetails: ${JSON.stringify(transactionDetails2, null, "\t")}`
    )
  );
} catch (e) {
    console.log("error received ", e);
  }
};
