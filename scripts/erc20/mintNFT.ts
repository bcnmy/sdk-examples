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
import {
  createSmartAccountClient,
  PaymasterMode,
  IHybridPaymaster,
  PaymasterFeeQuote,
  SponsorUserOperationDto,
  UserOpStatus,
} from "@biconomy/account";
import config from "../../config.json";
import inquirer from "inquirer";

export const mintNftPayERC20 = async () => {
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
  const smartAccount = await createSmartAccountClient({
    signer: client,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
  });
  const scwAddress = await smartAccount.getAccountAddress();
  console.log("SCW Address", scwAddress);

  // ------ 3. Generate transaction data
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
  const parsedAbi = parseAbi(["function safeMint(address _to)"]);
  const nftData = encodeFunctionData({
    abi: parsedAbi,
    functionName: "safeMint",
    args: [scwAddress as Hex],
  });

  const userop = await smartAccount.buildUserOp([{
    to: nftAddress,
    data: nftData,
  }],
  )

  console.log('userop', userop)

  const useropWithPnd = await smartAccount.getPaymasterUserOp(userop, 
    { mode: PaymasterMode.ERC20, 
      calculateGasLimits: false,
      preferredToken: '0xdA5289fCAAF71d52a80A254da614a192b693e977' } )

  console.log('useropWithPnd', useropWithPnd)

  const userOpWithsignature = await smartAccount.signUserOp(useropWithPnd)
  console.log('signature', userOpWithsignature.signature)

  /*const userOpResponse = await smartAccount.sendUserOp(useropWithPnd)

  const transactionDetails1: UserOpStatus =
      await userOpResponse.waitForTxHash();
    console.log("transachion hash", transactionDetails1.transactionHash);*/

  // ------ 4. Send transaction
  /*const { waitForTxHash } = await smartAccount.sendTransaction(
    {
      to: nftAddress,
      data: nftData,
    },
    {
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        preferredToken: config.preferredToken,
      },
    }
  );

  const { transactionHash } = await waitForTxHash();
  console.log("transactionHash", transactionHash);*/
};

