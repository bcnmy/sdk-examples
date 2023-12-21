import { ethers } from "ethers";
import { Hex, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import { polygonMumbai } from "viem/chains";
import { WalletClientSigner } from "@alchemy/aa-core";
import { BiconomySmartAccountV2 } from "@biconomy-devx/account";
import { Bundler } from "@biconomy-devx/bundler";
import config from "../../config.json";

export const mintNft = async () => {
  const account = privateKeyToAccount(config.privateKey as Hex);
  const client = createWalletClient({
    account,
    chain: polygonMumbai,
    transport: http(),
  });

  const eoa = client.account.address;
  console.log(chalk.blue(`EOA address: ${eoa}`));

  const bundler = new Bundler({
    bundlerUrl: config.bundlerUrl,
    chainId: config.chainId,
  });

  // create biconomy smart account instance
  const biconomySmartAccount = await BiconomySmartAccountV2.create({
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    bundler: bundler,
    signer: new WalletClientSigner(client as any, "viem"),
    biconomyPaymasterApiKey: "tf47vamuW.3c55594d-14f8-4451-b5dd-39f46abe272a",
  });
  const scwAddress = await biconomySmartAccount.getAccountAddress();
  console.log("SCW Address", scwAddress);

  // generate mintNft data
  const nftInterface = new ethers.utils.Interface([
    "function safeMint(address _to)",
  ]);

  // Here we are minting NFT to smart account address itself
  const data = nftInterface.encodeFunctionData("safeMint", [scwAddress]);
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
  const txObj = {
    to: nftAddress,
    data: data,
    value: 0,
  };
  const userOp = await biconomySmartAccount.buildUserOp([txObj, txObj]);
  console.log("userOp", userOp);

  const tx = await biconomySmartAccount.sendUserOp(userOp);
  const { transactionHash } = await tx.waitForTxHash();
  console.log("transactionHash", transactionHash);
};
