import {
  BICONOMY_TOKEN_PAYMASTER,
  PaymasterMode,
  type SupportedSigner,
  createSessionSmartAccountClient,
  createSmartAccountClient,
  getBatchSessionTxParams,
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
import { SessionFileStorage } from "@biconomy/session-file-storage"

const STORE_URL = __dirname

export const useTokenPaySessions = async () => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const preferredToken = config.preferredToken as Hex
  const account = privateKeyToAccount(config.privateKey as Hex)
  const chain = getChain(config.chainId)
  const client = createWalletClient({
    account,
    chain,
    transport: http()
  })

  const maxUnit256Value =
    115792089237316195423570985008687907853269984665640564039457584007913129639935n
  const approval = parseAbi([
    "function approve(address spender, uint256 value) external returns (bool)"
  ])
  const safeMint = parseAbi([
    "function safeMint(address owner) view returns (uint balance)"
  ])

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
      chainId: chain.id
    },
    fileSessionStorageClient,
    true // for batching
  )

  const nftMintTx = {
    to: nftAddress,
    data: encodeFunctionData({
      abi: safeMint,
      functionName: "safeMint",
      args: [smartAccountAddress]
    })
  }

  const approvalTx = {
    to: preferredToken,
    data: encodeFunctionData({
      abi: approval,
      functionName: "approve",
      args: [BICONOMY_TOKEN_PAYMASTER, 10000000000n] // Must be more than the expected value, could be retrieved from the getTokenFees() method
    })
  }

  const txs = [nftMintTx, approvalTx]

  const batchSessionParams = await getBatchSessionTxParams(
    txs,
    null,
    fileSessionStorageClient,
    chain
  )

  const { wait: waitForMint } = await smartAccountWithSession.sendTransaction(
    txs,
    {
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        preferredToken,
        skipPatchCallData: true // Should always be true for ERC20 with sessions
      },
      ...batchSessionParams
    }
  )
  const { success: mintSuccess } = await waitForMint()

  console.log(`${mintSuccess ? chalk.green("Success") : chalk.red("Failed")}`)
}
