import {
  type CreateSessionDataParams,
  PaymasterMode,
  type Policy,
  SessionFileStorage,
  createABISessionDatum,
  createBatchSession,
  createERC20SessionDatum,
  createSession as createSessionFromSDK,
  createSessionKeyEOA,
  createSmartAccountClient,
  getChain
} from "@biconomy-devx/account"
import chalk from "chalk"
import {
  http,
  type Hex,
  createWalletClient,
  encodeAbiParameters,
  parseEther
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import config from "../../config.json"

const STORE_URL = __dirname

export const createSessions = async (_amount: number) => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const chain = getChain(config.chainId)
  const account = privateKeyToAccount(config.privateKey as Hex)
  const amount = parseEther(_amount.toString())

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

  const leaves: CreateSessionDataParams[] = [
    createERC20SessionDatum({
      interval: {
        validUntil: 0,
        validAfter: 0
      },
      sessionKeyAddress,
      sessionKeyData: encodeAbiParameters(
        [
          { type: "address" },
          { type: "address" },
          { type: "address" },
          { type: "uint256" }
        ],
        [
          sessionKeyAddress,
          config.preferredToken as Hex,
          account.address,
          amount
        ]
      )
    }),
    createABISessionDatum({
      interval: {
        validUntil: 0,
        validAfter: 0
      },
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
      valueLimit: 0n
    })
  ]

  const { wait, session } = await createBatchSession(
    smartAccount,
    fileSessionStorageClient,
    leaves,
    {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED }
    }
  )

  const {
    receipt: { transactionHash },
    success
  } = await wait()

  console.log({ session, transactionHash })

  console.log(`${success ? chalk.green("Success") : chalk.red("Failed")}`)
}
