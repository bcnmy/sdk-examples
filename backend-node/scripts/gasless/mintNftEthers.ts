/** @format */

import { Hex, encodeFunctionData, parseAbi } from "viem";
import { ethers } from "ethers";
const chalk = require("chalk");
import { LocalAccountSigner } from "@alchemy/aa-core";
import { BiconomySmartAccountV2 } from "@biconomy/account";
import { BiconomyPaymaster, PaymasterMode } from "@biconomy/paymaster";
import config from "../../config.json";

export const mintNftEthers = async () => {
  // ----- 1. Generate EOA from private key
  let provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  let signer = new ethers.Wallet(config.privateKey, provider);
  const eoa = await signer.getAddress();
  console.log(chalk.blue(`EOA address: ${eoa}`));

  // ------ 2. Create biconomy smart account instance
  const biconomySmartAccount = await BiconomySmartAccountV2.create({
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    signer: new LocalAccountSigner(signer as any),
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
  });
  const scwAddress = await biconomySmartAccount.getAccountAddress();
  console.log("SCW Address", scwAddress);

  // ------ 3. Generate transaction data
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
  const parsedAbi = parseAbi(["function safeMint(address _to)"]);
  const nftData = encodeFunctionData({
    abi: parsedAbi,
    functionName: "safeMint",
    args: [scwAddress as Hex],
  });

  // ------ 4. Build user operation
  const userOp = await biconomySmartAccount.buildUserOp([
    {
      to: nftAddress,
      data: nftData,
      value: 0,
    },
  ]);
  console.log("userOp", userOp);

  // ------ 5. Get paymaster and data for gaslesss transaction
  const paymaster = new BiconomyPaymaster({
    paymasterUrl: config.biconomyPaymasterUrl,
  });
  const paymasterData = await paymaster.getPaymasterAndData(userOp, {
    mode: PaymasterMode.SPONSORED,
  });
  console.log("paymasterData", paymasterData);
  userOp.paymasterAndData = paymasterData.paymasterAndData;
  userOp.callGasLimit = paymasterData.callGasLimit;
  userOp.verificationGasLimit = paymasterData.verificationGasLimit;
  userOp.preVerificationGas = paymasterData.preVerificationGas;

  // ------ 6. Send user operation and get tx hash
  const tx = await biconomySmartAccount.sendUserOp(userOp);
  const { transactionHash } = await tx.waitForTxHash();
  console.log("transactionHash", transactionHash);
};
