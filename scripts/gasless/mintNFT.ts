import {
  Hex,
  createWalletClient,
  encodeFunctionData,
  http,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
const chalk = require("chalk");
import { blastSepolia } from "viem/chains";
import { createSmartAccountClient, PaymasterMode } from "@biconomy/account";
import config from "../../config.json";

export const mintNft = async () => {
  // ----- 1. Generate EOA from private key
  const account = privateKeyToAccount(config.privateKey as Hex);
  const client = createWalletClient({
    account,
    chain: blastSepolia,
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

  // negative cases of policies
  // case of using webhooks
  // case of using different SA

  // ------ 4. Send transaction
  const { wait } = await smartAccount.sendTransaction(
    {
      "to": "0x22d55D3273c90Bb1E40de4466403F81fA96d0feF",
      "data": "0x6dc06a450000000000000000000000007f0408bc8dfe90c09072d8ccf3a1c544737bcdb60000000000000000000000007f0408bc8dfe90c09072d8ccf3a1c544737bcdb60000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000098968000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000416a45b9cc3a59a728223510ff84c894efa9340eaf8ce721002af2fe4a7665e2d00d6743fdde925b8d3cc361ebbac25f81b4061f68af158d842ee1fac9305607e41c00000000000000000000000000000000000000000000000000000000000000",
      "value": "70000000000000000"
    },
    { paymasterServiceData: { mode: PaymasterMode.SPONSORED },
      simulationType: 'validation_and_execution'
    }
  );
  const receipt = await wait();
  console.log("receipt", receipt);
};
