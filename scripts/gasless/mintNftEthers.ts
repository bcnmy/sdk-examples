import { ethers } from "ethers"
import { type Hex, encodeFunctionData, parseAbi } from "viem"
const chalk = require("chalk")
import {
  PaymasterMode,
  type SupportedSigner,
  createSmartAccountClient
} from "@biconomy/account"
import config from "../../config.json"

export const mintNftEthers = async () => {
  // ----- 1. Generate EOA from private key
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const signer: SupportedSigner = new ethers.Wallet(config.privateKey, provider)
  const eoa = await signer.getAddress()
  console.log(chalk.blue(`EOA address: ${eoa}`))

  // ------ 2. Create biconomy smart account instance
  const smartAccount = await createSmartAccountClient({
    signer,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey
  })
  console.log("here")
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

  // ------ 4. Build user operation
  const tx = {
    to: nftAddress,
    data: nftData
  }

  // ------ 5. Send user operation and get tx hash
  const { waitForTxHash } = await smartAccount.sendTransaction(tx, {
    paymasterServiceData: { mode: PaymasterMode.SPONSORED }
  })
  const { transactionHash } = await waitForTxHash()
  console.log("transactionHash", transactionHash)
}
