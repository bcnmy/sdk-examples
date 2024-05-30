import {
  http,
  type Hex,
  createWalletClient,
  encodeFunctionData,
  parseEther
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
const chalk = require("chalk")
import {
  PaymasterMode,
  type SupportedSigner,
  createSmartAccountClient
} from "@biconomy-devx/account"
import config from "../../config.json"
import { ERC20ABI } from "../utils/abi"
import { getChain } from "../utils/getChain"

export const erc20TransferPayERC20 = async (
  recipientAddress: string,
  amount: number,
  tokenAddress: string
) => {
  // ----- 1. Generate EOA from private key
  const account = privateKeyToAccount(config.privateKey as Hex)
  const client = createWalletClient({
    account,
    transport: http(),
    chain: getChain(config.chainId)
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
  console.log("imp", parseEther(amount.toString()))
  const data = encodeFunctionData({
    abi: ERC20ABI,
    functionName: "transfer",
    args: [recipientAddress, parseEther(amount.toString())] // parsing token value with base 18
  })

  // ------ 4. Send transaction
  const transaction = {
    to: tokenAddress,
    data: data
  }

  const { waitForTxHash } = await smartAccount.sendTransaction(transaction, {
    paymasterServiceData: {
      mode: PaymasterMode.ERC20,
      preferredToken: config.preferredToken
    }
  })

  const { transactionHash } = await waitForTxHash()
  console.log("transactionHash", transactionHash)
}
