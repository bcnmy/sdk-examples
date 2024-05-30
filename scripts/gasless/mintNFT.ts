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
  createPaymaster,
  createSmartAccountClient
} from "@biconomy-devx/account"
import config from "../../config.json"
import { getChain } from "../utils/getChain"

export const mintNft = async () => {
  // ----- 1. Generate EOA from private key
  const account = privateKeyToAccount(config.privateKey as Hex)
  const client = createWalletClient({
    account,
    chain: getChain(config.chainId),
    transport: http()
  })
  const eoa = client.account.address
  console.log(chalk.blue(`EOA address: ${eoa}`))

  const paymaster = await createPaymaster({
    strictMode: true,
    paymasterUrl: config.biconomyPaymasterUrl
  })

  // ------ 2. Create biconomy smart account instance
  const smartAccount = await createSmartAccountClient({
    signer: client as SupportedSigner,
    bundlerUrl: config.bundlerUrl,
    paymaster
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

  // negative cases of policies
  // case of using webhooks
  // case of using different SA

  // ------ 4. Send transaction
  const { waitForTxHash } = await smartAccount.sendTransaction(
    {
      to: nftAddress,
      data: nftData
    },
    { paymasterServiceData: { mode: PaymasterMode.SPONSORED } }
  )
  const { transactionHash } = await waitForTxHash()
  console.log("transactionHash", transactionHash)
}
