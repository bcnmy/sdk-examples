import {
  Hex,
  createWalletClient,
  encodeFunctionData,
  http,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseGoerli } from "viem/chains";
import {
  PaymasterMode,
  createSmartAccountClient,
} from "@biconomy-devx/account";
import {
  DEFAULT_MULTICHAIN_MODULE,
  createMultiChainValidationModule,
  SupportedSigner,
} from "@biconomy-devx/account";
import config from "../../config.json";
import { getChain } from "../utils/getChain";

export const multiChainMint = async () => {
  // ----- 1. Generate EOA from private key
  const account = privateKeyToAccount(config.privateKey as Hex);
  const mumbaiClient = createWalletClient({
    account,
    chain: getChain(config.chainId),
    transport: http(),
  });
  const baseClient = createWalletClient({
    account,
    chain: baseGoerli,
    transport: http(),
  });

  // ------ 2. Create module and biconomy smart account instance
  const multiChainModule = await createMultiChainValidationModule({
    signer: mumbaiClient as SupportedSigner,
    moduleAddress: DEFAULT_MULTICHAIN_MODULE,
  });
  const smartAccount1 = await createSmartAccountClient({
    signer: mumbaiClient as SupportedSigner,
    chainId: 80001,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
    defaultValidationModule: multiChainModule,
    activeValidationModule: multiChainModule,
  });
  const scwAddress1 = await smartAccount1.getAccountAddress();
  console.log("SCW Address 1", scwAddress1);

  const smartAccount2 = await createSmartAccountClient({
    signer: baseClient as SupportedSigner,
    chainId: 84531,
    bundlerUrl:
      "https://bundler.biconomy.io/api/v2/84531/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKeyBase,
    defaultValidationModule: multiChainModule,
    activeValidationModule: multiChainModule,
  });
  const scwAddress2 = await smartAccount2.getAccountAddress();
  console.log("SCW Address 2", scwAddress2);

  // ------ 3. Generate transaction data
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
  const parsedAbi = parseAbi(["function safeMint(address _to)"]);
  const nftData1 = encodeFunctionData({
    abi: parsedAbi,
    functionName: "safeMint",
    args: [scwAddress1 as Hex],
  });
  const nftData2 = encodeFunctionData({
    abi: parsedAbi,
    functionName: "safeMint",
    args: [scwAddress2 as Hex],
  });

  // ------ 4. Build user operation
  let userOp1 = await smartAccount1.buildUserOp(
    [
      {
        to: nftAddress,
        data: nftData1,
      },
    ],
    { paymasterServiceData: { mode: PaymasterMode.SPONSORED } }
  );
  let userOp2 = await smartAccount2.buildUserOp(
    [
      {
        to: nftAddress,
        data: nftData2,
      },
    ],
    { paymasterServiceData: { mode: PaymasterMode.SPONSORED } }
  );

  const returnedOps = await multiChainModule.signUserOps([
    { userOp: userOp1, chainId: 80001 },
    { userOp: userOp2, chainId: 84531 },
  ]);

  try {
    const tx = await smartAccount1.sendSignedUserOp(returnedOps[0]);
    const { transactionHash } = await tx.waitForTxHash();
    console.log("transactionHash1", transactionHash);
  } catch (e) {
    console.log("error received ", e);
  }

  try {
    const tx = await smartAccount2.sendSignedUserOp(returnedOps[1]);
    const { transactionHash } = await tx.waitForTxHash();
    console.log("transactionHash2", transactionHash);
  } catch (e) {
    console.log("error received ", e);
  }
};
