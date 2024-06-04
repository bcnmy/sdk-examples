import {
  PaymasterMode,
  type SupportedSigner,
  type Transaction,
  createSessionSmartAccountClient,
  createSmartAccountClient,
  getBatchSessionTxParams,
  getChain
} from "@biconomy/account"
import chalk from "chalk"
import {
  http,
  type Hex,
  createWalletClient,
  encodeFunctionData,
  parseAbi,
  parseEther
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import config from "../../config.json"
import { SessionFileStorage } from "@biconomy/session-file-storage"

const STORE_URL = __dirname

export const useSessions = async (_amount: number) => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const account = privateKeyToAccount(config.privateKey as Hex)
  const amount = parseEther(_amount.toString())
  const chain = getChain(config.chainId)
  const client = createWalletClient({
    account,
    chain: getChain(config.chainId),
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
    fileSessionStorageClient, // Storage client, full Session or smartAccount address if using default storage
    true
  )

  const transferTx: Transaction = {
    to: config.preferredToken,
    data: encodeFunctionData({
      abi: parseAbi(["function transfer(address _to, uint256 _value)"]),
      functionName: "transfer",
      args: [client.account.address, amount]
    })
  }
  const nftMintTx: Transaction = {
    to: nftAddress,
    data: encodeFunctionData({
      abi: parseAbi(["function safeMint(address _to)"]),
      functionName: "safeMint",
      args: [smartAccountAddress]
    })
  }

  const txs = [transferTx, nftMintTx]

  const batchSessionParams = await getBatchSessionTxParams(
    txs,
    null, // Use the last two sessions
    fileSessionStorageClient,
    chain
  )

  const { wait: mintWait } = await smartAccountWithSession.sendTransaction(
    txs,
    {
      paymasterServiceData: {
        mode: PaymasterMode.SPONSORED
      },
      ...batchSessionParams
    }
  )

  const { success } = await mintWait()
  console.log(`${success ? chalk.green("Success") : chalk.red("Failed")}`)
}
