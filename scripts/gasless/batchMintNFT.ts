import {
  http,
  type Hex,
  createWalletClient,
  encodeFunctionData,
  parseAbi
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
const chalk = require("chalk")
import {
  PaymasterMode,
  type SupportedSigner,
  createSmartAccountClient
} from "@biconomy/account"
import config from "../../config.json"
import { getChain } from "../utils/getChain"

export const batchMintNft = async () => {
  // ----- 1. Generate EOA from private key
  const account = privateKeyToAccount(config.privateKey as Hex)
  const client = createWalletClient({
    account,
    chain: getChain(config.chainId),
    transport: http()
  })
  const eoa = client.account.address
  console.log(chalk.blue(`EOA address: ${eoa}`))

  // ------ 2. Create biconomy smart account instance
  const smartAccount = await createSmartAccountClient({
    signer: client as SupportedSigner,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey
  })
  const scwAddress = await smartAccount.getAccountAddress()
  console.log("SCW Address", scwAddress)

  // ------ 3. Generate transaction data
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const parsedAbi = parseAbi(["function safeMint(address _to)"])
  const nftData = encodeFunctionData({
    abi: parsedAbi,
    functionName: "safeMint",
    args: [scwAddress as Hex]
  })

  // ------ 4. Send transaction
  const { waitForTxHash } = await smartAccount.sendTransaction(
    [{
      to: nftAddress,
      data: nftData
    },
    {
      to: nftAddress,
      data: nftData,
    }],
    { paymasterServiceData: { mode: PaymasterMode.SPONSORED } }
  )
  const { transactionHash } = await waitForTxHash()
  console.log("transactionHash", transactionHash)
}
