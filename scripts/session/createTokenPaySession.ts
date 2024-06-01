import {
  BICONOMY_TOKEN_PAYMASTER,
  PaymasterMode,
  type Policy,
  SessionFileStorage,
  createSession,
  createSessionKeyEOA,
  createSmartAccountClient,
  getChain
} from "@biconomy/account"
import chalk from "chalk"
import { http, type Hex, createWalletClient, parseAbi } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import config from "../../config.json"

const STORE_URL = __dirname

export const createTokenPaySession = async () => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const preferredToken = config.preferredToken as Hex
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

  const maxUnit256Value =
    115792089237316195423570985008687907853269984665640564039457584007913129639935n
  const approval = parseAbi([
    "function approve(address spender, uint256 value) external returns (bool)"
  ])
  const safeMint = parseAbi([
    "function safeMint(address owner) view returns (uint balance)"
  ])
  const policy: Policy[] = [
    {
      interval: {
        validUntil: 0,
        validAfter: 0
      },
      sessionKeyAddress,
      contractAddress: nftAddress,
      functionSelector: safeMint[0],
      rules: [
        {
          offset: 0,
          condition: 0,
          referenceValue: smartAccountAddress
        }
      ],
      valueLimit: 0n
    },
    {
      interval: {
        validUntil: 0,
        validAfter: 0
      },
      sessionKeyAddress,
      contractAddress: preferredToken,
      functionSelector: approval[0],
      rules: [
        {
          offset: 0,
          condition: 0, // equal
          referenceValue: BICONOMY_TOKEN_PAYMASTER
        },
        {
          offset: 32,
          condition: 1, // less than or equal
          referenceValue: maxUnit256Value // max amount
        }
      ],
      valueLimit: 0n
    }
  ]

  const { wait } = await createSession(
    smartAccount,
    policy,
    fileSessionStorageClient,
    {
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        preferredToken,
        skipPatchCallData: true // Should always be true for ERC20 with sessions
      }
    }
  )

  const { success } = await wait()

  console.log(`${success ? chalk.green("Success") : chalk.red("Failed")}`)
}
