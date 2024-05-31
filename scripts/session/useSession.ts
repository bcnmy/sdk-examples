import {
  PaymasterMode,
  SessionFileStorage,
  type SupportedSigner,
  createSessionSmartAccountClient,
  createSmartAccountClient,
  getChain,
  getSingleSessionTxParams
} from "@biconomy/account"
import chalk from "chalk"
import {
  http,
  type Hex,
  createWalletClient,
  encodeFunctionData,
  parseAbi
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import config from "../../config.json"

const STORE_URL = __dirname

export const useSession = async () => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const account = privateKeyToAccount(config.privateKey as Hex)
  const chain = getChain(config.chainId)
  const client = createWalletClient({
    account,
    chain,
    transport: http()
  })

  const smartAccount = await createSmartAccountClient({
    signer: client as SupportedSigner,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey
  })

  const smartAccountAddress = await smartAccount.getAccountAddress()

  const fileSessionStorageClient = new SessionFileStorage(
    smartAccountAddress,
    STORE_URL
  )

  const smartAccountWithSession = await createSessionSmartAccountClient(
    {
      accountAddress: smartAccountAddress, // Set the account address on behalf of the user
      bundlerUrl: config.bundlerUrl,
      biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
      chainId: config.chainId
    },
    fileSessionStorageClient // Storage client, full Session or smartAccount address if using default storage
  )

  const tx = {
    to: nftAddress,
    data: encodeFunctionData({
      abi: parseAbi(["function safeMint(address _to)"]),
      functionName: "safeMint",
      args: [smartAccountAddress]
    })
  }

  const singleSessionParams = await getSingleSessionTxParams(
    fileSessionStorageClient,
    chain,
    null
  )

  const { wait: mintWait } = await smartAccountWithSession.sendTransaction(tx, {
    paymasterServiceData: { mode: PaymasterMode.SPONSORED },
    ...singleSessionParams
  })

  const { success } = await mintWait()
  console.log(`${success ? chalk.green("Success") : chalk.red("Failed")}`)
}
