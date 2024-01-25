import { Hex, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import { polygonMumbai } from "viem/chains";
import {
  WalletClientSigner,
  createSmartWalletClient,
  Paymaster,
  PaymasterMode,
} from "@biconomy-devx/account";
import config from "../../config.json";

export const nativeTransfer = async (to: string, amount: number) => {
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
  const smartWallet = await createSmartWalletClient({
    signer: client,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
  });
  const scwAddress = await smartWallet.getAccountAddress();
  console.log("SCW Address", scwAddress);

  // ------ 3. Generate transaction data
  const txData = {
    to,
    value: parseEther(amount.toString()),
  };

  // ------ 4. Build user operation
  const userOp = await smartWallet.buildUserOp([txData]);
  console.log("userOp", userOp);

  // ------ 5. Get paymaster and data for gaslesss transaction
  const paymaster = new Paymaster({
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
  const tx = await smartWallet.sendUserOp(userOp);
  const { transactionHash } = await tx.waitForTxHash();
  console.log("transactionHash", transactionHash);
};
