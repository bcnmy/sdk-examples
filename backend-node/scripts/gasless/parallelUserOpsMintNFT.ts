import {
  Hex,
  createWalletClient,
  encodeFunctionData,
  http,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import { polygonMumbai } from "viem/chains";
import { WalletClientSigner } from "@alchemy/aa-core";
import { BiconomySmartAccountV2 } from "@biconomy-devx/account";
import { BiconomyPaymaster, PaymasterMode } from "@biconomy-devx/paymaster";
import config from "../../config.json";

const numOfParallelUserOps = config.numOfParallelUserOps;

export const parallelUserOpsMintNft = async () => {
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
  const biconomySmartAccount = await BiconomySmartAccountV2.create({
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    signer: new WalletClientSigner(client as any, "viem"),
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

  // ------ 4. Build user operations
  let partialUserOps = [];
  // Use a nonceKey that is unique, easy way is to increment the nonceKey
  for (let nonceKey = 0; nonceKey < numOfParallelUserOps; nonceKey++) {
    let partialUserOp = await biconomySmartAccount.buildUserOp(
      [
        {
          to: nftAddress,
          data: nftData,
          value: 0,
        },
      ],
      { nonceOptions: { nonceKey } }
    );
    partialUserOps.push(partialUserOp);
  }

  // ------ 5. Get paymaster and data for gaslesss transaction
  const paymaster = new BiconomyPaymaster({
    paymasterUrl: config.biconomyPaymasterUrl,
  });
  try {
    for (let index = 0; index < numOfParallelUserOps; index++) {
      const pData = await paymaster.getPaymasterAndData(partialUserOps[index], {
        mode: PaymasterMode.SPONSORED,
      });
      partialUserOps[index].paymasterAndData = pData.paymasterAndData;
      partialUserOps[index].callGasLimit = pData.callGasLimit;
      partialUserOps[index].verificationGasLimit = pData.verificationGasLimit;
      partialUserOps[index].preVerificationGas = pData.preVerificationGas;
    }
  } catch (e) {
    console.log("error received ", e);
  }

  // ------ 6. Send user operation and get tx hash
  try {
    let userOpResponsePromises = [];
    /**
     * Will shuffle userOps here based on a random logic and send them randomly
     */
    const shuffledPartialUserOps = partialUserOps.sort(
      () => Math.random() - 0.5
    );
    for (let index = 0; index < numOfParallelUserOps; index++) {
      console.log(
        chalk.blue(
          `userOp: ${JSON.stringify(shuffledPartialUserOps[index], null, "\t")}`
        )
      );
      console.log(
        chalk.blue(
          `userOp nonce being sent to bundler: ${JSON.stringify(
            Number(shuffledPartialUserOps[index].nonce),
            null,
            "\t"
          )}`
        )
      );
      const userOpResponsePromise = biconomySmartAccount.sendUserOp(
        shuffledPartialUserOps[index]
      );
      userOpResponsePromises.push(userOpResponsePromise);
    }

    const userOpResponses = await Promise.all(userOpResponsePromises);

    for (let index = 0; index < numOfParallelUserOps; index++) {
      const transactionDetails = await userOpResponses[index].waitForTxHash();
      console.log("transactionDetails", transactionDetails.transactionHash);
    }
  } catch (e) {
    console.log("error received ", e);
  }
};
