import {
  Hex,
  createWalletClient,
  encodeFunctionData,
  http,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import { polygonMumbai } from "viem/chains";
import {
  createSmartWalletClient,
  Paymaster,
  PaymasterMode,
} from "@biconomy-devx/account";
import config from "../../config.json";
import { ERC20ABI } from "../utils/abi";

export const erc20Transfer = async (
  recipientAddress: string,
  amount: number,
  tokenAddress: string
) => {
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
  console.log("imp", parseEther(amount.toString()));
  const data = encodeFunctionData({
    abi: ERC20ABI,
    functionName: "transfer",
    args: [recipientAddress, parseEther(amount.toString())], // parsing token value with base 18
  });

  // ------ 4. Build user operation
  const userOp = await smartWallet.buildUserOp([
    {
      to: tokenAddress,
      data: data,
    },
  ]);
  console.log("userOp", userOp);

  // ------ 5. Get paymaster and data for gaslesss transaction
  const paymaster = new Paymaster({
    paymasterUrl: config.biconomyPaymasterApiKey,
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
