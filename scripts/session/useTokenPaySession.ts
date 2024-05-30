import {
  BICONOMY_TOKEN_PAYMASTER,
  PaymasterMode,
  SessionFileStorage,
  type SupportedSigner,
  createSessionSmartAccountClient,
  createSmartAccountClient,
  getChain,
  getSingleSessionTxParams
} from "@biconomy-devx/account"
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

export const useTokenPaySession = async () => {
  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
  const preferredToken = config.preferredToken

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
  const approval = parseAbi([
    "function approve(address spender, uint256 value) external returns (bool)"
  ])
  const safeMint = parseAbi([
    "function safeMint(address owner) view returns (uint balance)"
  ])

  const smartAccountWithSession = await createSessionSmartAccountClient(
    {
      accountAddress: smartAccountAddress, // Set the account address on behalf of the user
      bundlerUrl: config.bundlerUrl,
      biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
      chainId: chain.id
    },
    fileSessionStorageClient
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

  const allSessionsLength = (await fileSessionStorageClient.getAllSessionData())
    .length

  const singleSessionParamsForMint = await getSingleSessionTxParams(
    fileSessionStorageClient,
    chain,
    allSessionsLength - 2 // index of penultimate leaf
  )

  const singleSessionParamsForApproval = await getSingleSessionTxParams(
    fileSessionStorageClient,
    chain,
    allSessionsLength - 1 // index of last leaf
  )

  const { wait: waitForApprovalTx } =
    await smartAccountWithSession.sendTransaction(approvalTx, {
      ...singleSessionParamsForApproval,
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        preferredToken,
        skipPatchCallData: true // This omits the automatic patching of the call data with approvals
      }
    })

  const { wait: waitForMintTx } = await smartAccountWithSession.sendTransaction(
    nftMintTx,
    {
      ...singleSessionParamsForMint,
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        preferredToken,
        skipPatchCallData: true // Should always be true for ERC20 with sessions
      }
    }
  )

  const { success: txApprovalSuccess } = await waitForApprovalTx()
  const { success: txMintSuccess } = await waitForMintTx()
  console.log(
    `${
      txApprovalSuccess
        ? chalk.green("txApprovalSuccess Success")
        : chalk.red("txApprovalSuccess Failed")
    }`
  )
  console.log(
    `${
      txMintSuccess
        ? chalk.green("txMintSuccess Success")
        : chalk.red("txMintSuccess Failed")
    }`
  )
}
