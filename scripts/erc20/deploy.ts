import { http, type Hex, createPublicClient, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
const chalk = require("chalk")
import {
  PaymasterMode,
  type SupportedSigner,
  createSmartAccountClient
} from "@biconomy/account"
import config from "../../config.json"
import { getChain } from "../utils/getChain"
import { getRandomInteger } from "../utils/getRandomInteger"

export const deploySmartContractPayERC20 = async () => {
  console.log("deploySmartContractPayERC20...")
  // ----- 1. Create public client
  const publicClient = createPublicClient({
    chain: getChain(config.chainId),
    transport: http()
  })

  // ----- 2. Generate EOA from private key
  const account = privateKeyToAccount(config.privateKey as Hex)
  const client = createWalletClient({
    account,
    chain: getChain(config.chainId),
    transport: http()
  })
  const eoa = client.account.address
  console.log(chalk.blue(`EOA address: ${eoa}`))

  // ------ 3. Create biconomy smart account instance
  const smartAccount = await createSmartAccountClient({
    signer: client as SupportedSigner,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
    index: getRandomInteger(0, 100000) // To ensure the smart account is not already deployed
  })

  const scwAddress = await smartAccount.getAccountAddress()
  console.log("SCW Address", scwAddress)

  // ------ 4. Check if already deployed
  const byteCode = await publicClient.getBytecode({
    address: await smartAccount.getAccountAddress()
  })
  if ((byteCode?.length ?? 0) > 2) {
    console.log("Smart account already deployed")
    return
  }

  // ------ 5. Send transaction
  const { wait } = await smartAccount.deploy({
    paymasterServiceData: {
      mode: PaymasterMode.ERC20,
      preferredToken: config.preferredToken
    }
  })

  const {
    success,
    receipt: { transactionHash }
  } = await wait()

  const newByteCode = await publicClient.getBytecode({
    address: await smartAccount.getAccountAddress()
  })

  console.log("transactionHash", transactionHash, newByteCode)
}
