import { ethers } from "ethers";
import { Hex, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import { polygonMumbai } from "viem/chains";
import { WalletClientSigner } from "@alchemy/aa-core";
import {
  BiconomySmartAccountV2,
} from "@biconomy-devx/account";
import { Bundler } from "@biconomy-devx/bundler";
import { BiconomyPaymaster, PaymasterMode } from "@biconomy-devx/paymaster";
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
  const paymaster = new BiconomyPaymaster({
    paymasterUrl: config.biconomyPaymasterUrl
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

  const userOp = await biconomySmartAccount.buildUserOp([
    {
      to: nftAddress,
      data: data,
      value: 0,
    },
  ]);
  console.log("userOp", userOp);

  const paymasterData = await paymaster.getPaymasterAndData(userOp, {
    mode: PaymasterMode.SPONSORED,
  });
  console.log("paymasterData", paymasterData);
  userOp.paymasterAndData = paymasterData.paymasterAndData;
  userOp.callGasLimit = paymasterData.callGasLimit;
  userOp.verificationGasLimit = paymasterData.verificationGasLimit;
  userOp.preVerificationGas = paymasterData.preVerificationGas;

  const tx = await biconomySmartAccount.sendUserOp(userOp);
  const { transactionHash } = await tx.waitForTxHash();
  console.log("transactionHash", transactionHash);
};
