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

const bundlerUrlChain1 = config.bundlerUrl
const bundlerUrlChain2 = "https://bundler.biconomy.io/api/v2/84531/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"

const rpcUrlChain1 = config.rpcUrl
const rpcUrlChain2 = "https://goerli.base.org"

const paymasterUrlChain1 = config.biconomyPaymasterUrl
const paymasterUrlChain2 = "https://paymaster.biconomy.io/api/v1/84531/ZmJnk8RoQ.74fa6f0e-e8da-4ca4-a8c7-a234b76d1dcf"

const chainId1 = config.chainId
const chainId2 = 84531


// 1. Create instance of Multichain Module
// 2. Create smart account instances on all chains with activeValidationModule as multichain module
// 3. enable multichain module on-chain if not already enabled
// 4. build userOp on all chains
// 5. sign userOps on all chains at once with help of multichain module instance
// 6. send returned user operations on different chains


export const multiChainMint = async () => {
  let provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  let signer = new ethers.Wallet(config.privateKey, provider);

  // create multichain validation module instance
  const multiChainModule = await MultiChainValidationModule.create({
    signer: signer,
    moduleAddress: DEFAULT_MULTICHAIN_MODULE
  })

  // get smart account instance for chain1
  const smartAccountChain1 = await getInstanceChain1(multiChainModule);

  // get smart account instance for chain2
  const smartAccountChain2 = await getInstanceChain2(multiChainModule);

  const nftInterface = new ethers.utils.Interface([
    "function safeMint(address _to)",
  ]);

  // Assuming smart account address is same on multiple chains
  const scwAddress = await smartAccountChain1.getAccountAddress();

  // Here we are minting NFT to smart account address itself
  const data1 = nftInterface.encodeFunctionData("safeMint", [scwAddress]);

  // Assuming NFT address is same on multiple chains
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"; 
  const transaction = {
    to: nftAddress,
    data: data1,
  };

  // build partial userOp for chain1
  let partialUserOp1 = await smartAccountChain1.buildUserOp([transaction], { 
    paymasterServiceData: {
    mode: PaymasterMode.SPONSORED,
  }});

  // build partial userOp for chain2
  let partialUserOp2 = await smartAccountChain2.buildUserOp([transaction], { 
    paymasterServiceData: {
    mode: PaymasterMode.SPONSORED,
  }});

  const returnedOps = await multiChainModule.signUserOps([{userOp: partialUserOp1, chainId: chainId1}, {userOp: partialUserOp2, chainId: chainId2}]);

  console.log("both returned ops")
  console.log(returnedOps)


  try{
  // Here we already have multichain signature so we will use sendSignedTransaction on individual instances  
  // Make sure multiChainModule is provided as active validation module, if not set it as active validation module
  // If a different defaultValidationModule is used then multichain module must be enabled on the smart account


  // If multichain module is not enabled on your smart account first enable the module

  smartAccountChain1.setActiveValidationModule(multiChainModule);

  const userOpResponse1 = await smartAccountChain1.sendSignedUserOp(returnedOps[0] as any);
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

  smartAccountChain2.setActiveValidationModule(multiChainModule);  

  const userOpResponse2 = await smartAccountChain2.sendSignedUserOp(returnedOps[1] as any);
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

// Helpers to create smart account instances

export const getInstanceChain1 = async (multiChainModule: MultiChainValidationModule): Promise<BiconomySmartAccountV2> => {

  // create bundler and paymaster instances
  const bundler = new Bundler({
    bundlerUrl: bundlerUrlChain1,
    chainId: chainId1,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
  });

  const paymaster = new BiconomyPaymaster({
    paymasterUrl: paymasterUrlChain1
  });

  // Biconomy smart account config
  // Note that paymaster and bundler are optional. You can choose to create new instances of this later and make account API use 
  const biconomySmartAccountConfig = {
    chainId: chainId1,
    rpcUrl: rpcUrlChain1,
    paymaster: paymaster, 
    bundler: bundler, 
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    defaultValidationModule: multiChainModule,
    activeValidationModule: multiChainModule
  };

  // create biconomy smart account instance
  const biconomySmartAccount1 = await BiconomySmartAccountV2.create(biconomySmartAccountConfig);

  return biconomySmartAccount1;
}

export const getInstanceChain2 = async (multiChainModule: MultiChainValidationModule) : Promise<BiconomySmartAccountV2> => {
  const bundler = new Bundler({
    bundlerUrl: bundlerUrlChain2,
    chainId: chainId2,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
  });

  const paymaster = new BiconomyPaymaster({
    paymasterUrl: paymasterUrlChain2
  });

  const biconomySmartAccountConfig = {
    chainId: chainId2,
    rpcUrl: rpcUrlChain2,
    paymaster: paymaster, 
    bundler: bundler, 
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    defaultValidationModule: multiChainModule,
    activeValidationModule: multiChainModule
  };


  // create biconomy smart account instance
  const biconomySmartAccount2 = await BiconomySmartAccountV2.create(biconomySmartAccountConfig);

  return biconomySmartAccount2;
}
