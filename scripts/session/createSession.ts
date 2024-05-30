import {
  PaymasterMode,
  type Policy,
  SessionFileStorage,
  createSession as createSessionFromSDK,
  createSessionKeyEOA,
  createSmartAccountClient,
  getChain
} from "@biconomy-devx/account"
import chalk from "chalk"
import { http, type Hex, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import config from "../../config.json"

const STORE_URL = __dirname

export const createSession = async () => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const chain = getChain(config.chainId)
  const account = privateKeyToAccount(config.privateKey as Hex)

  const signer = createWalletClient({
    account,
    chain,
    transport: http()
  })

  const smartAccount = await createSmartAccountClient({
    signer,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey
  })

  const smartAccountAddress = await smartAccount.getAccountAddress()

  const fileSessionStorageClient = new SessionFileStorage(
    smartAccountAddress,
    STORE_URL
  )

  const { sessionKeyAddress } = await createSessionKeyEOA(
    smartAccount,
    chain,
    fileSessionStorageClient
  )

  const policy: Policy[] = [
    {
      sessionKeyAddress,
      contractAddress: nftAddress,
      functionSelector: "safeMint(address)",
      rules: [
        {
          offset: 0,
          condition: 0,
          referenceValue: smartAccountAddress
        }
      ],
      interval: {
        validUntil: 0,
        validAfter: 0
      },
      valueLimit: 0n
    }
  ]

  const { wait } = await createSessionFromSDK(
    smartAccount,
    policy,
    fileSessionStorageClient,
    {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED }
    }
  )

  const { success } = await wait()

  console.log(`${success ? chalk.green("Success") : chalk.red("Failed")}`)
}
