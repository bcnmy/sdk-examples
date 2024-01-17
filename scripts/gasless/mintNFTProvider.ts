import {
  Hex,
  createWalletClient,
  encodeFunctionData,
  http,
  parseAbi,
} from "viem";
import { polygonMumbai } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import { WalletClientSigner } from "@alchemy/aa-core";
import {
  BiconomySmartAccountV2,
  BiconomyAccountProvider,
} from "@biconomy/account";
import config from "../../config.json";

export const mintNFTProvider = async () => {
  // ----- 1. Generate EOA from private key
  const account = privateKeyToAccount(config.privateKey as Hex);
  const client = createWalletClient({
    account,
    chain: polygonMumbai,
    transport: http(),
  });
  const eoa = client.account.address;
  console.log(chalk.blue(`EOA address: ${eoa}`));

  // ------ 2. Create biconomy smart provider instance
  const biconomySmartAccount = await createSmartWalletClient({
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    signer: client,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
  });
  const provider = new BiconomyAccountProvider({
    chain: polygonMumbai,
    rpcProvider: config.rpcUrl,
  }).connect((_rpcClient) => biconomySmartAccount);

  const scwAddress = await provider.getAddress();
  console.log("SCW Address", scwAddress);

  // ------ 3. Generate transaction data
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e";
  const parsedAbi = parseAbi(["function safeMint(address _to)"]);
  const nftData = encodeFunctionData({
    abi: parsedAbi,
    functionName: "safeMint",
    args: [scwAddress as Hex],
  });

  // ------ 4. send transaction using provider
  const tx = await provider.sendUserOperations({
    target: nftAddress,
    data: nftData,
    value: BigInt(0),
  });
  const { transactionHash } = await tx.waitForTxHash();
  console.log("transactionHash", transactionHash);
};
