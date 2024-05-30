import { http, type Hex, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
const chalk = require("chalk")
import {
  type SupportedSigner,
  createSmartAccountClient
} from "@biconomy-devx/account"
import config from "../config.json"
import { getChain } from "./utils/getChain"

export const getAddress = async () => {
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
}
