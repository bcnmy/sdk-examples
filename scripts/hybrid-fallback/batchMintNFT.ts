import { ethers } from "ethers"
const chalk = require("chalk")
import {
  type BiconomySmartAccountV2Config,
  type PaymasterFeeQuote,
  PaymasterMode
} from "@biconomy/account"
import { createSmartAccountClient } from "@biconomy/account"
import inquirer from "inquirer"
import config from "../../config.json"

export const batchMintNftTrySponsorshipOtherwisePayERC20 = async () => {
  // ------------------------STEP 1: Initialise Biconomy Smart Account SDK--------------------------------//

  // get EOA address from wallet provider
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const signer = new ethers.Wallet(config.privateKey, provider)
  const eoa = await signer.getAddress()
  console.log(chalk.blue(`EOA address: ${eoa}`))

  // Biconomy smart account config
  // Note that paymaster and bundler are optional. You can choose to create new instances of this later and make account API use
  const smartWalletConfig: BiconomySmartAccountV2Config = {
    signer,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
    bundlerUrl: config.bundlerUrl
  }

  // create biconomy smart account instance
  const smartWallet = await createSmartAccountClient(smartWalletConfig)

  // ------------------------STEP 2: Build the transaction --------------------------------//

  const nftInterface = new ethers.utils.Interface([
    "function safeMint(address _to)"
  ])

  const scwAddress = await smartWallet.getAccountAddress()

  // Here we are minting NFT to smart account address itself
  const data = nftInterface.encodeFunctionData("safeMint", [scwAddress])

  const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e" // Todo // use from config
  const transaction = {
    to: nftAddress,
    data: data
  }

  // ------------------------STEP 3: Prepare and send user operation --------------------------------//

  const feeQuotesOrDataResponse = await smartWallet.getTokenFees(transaction, {
    paymasterServiceData: {
      tokenList: config.tokenList ? config.tokenList : [],
      preferredToken: config.preferredToken,
      mode: PaymasterMode.ERC20
    }
  })

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let userOpResponse: any

  if (feeQuotesOrDataResponse.feeQuotes) {
    // this means sponsorship is successful and now you can offer fee quotes to the user to pay with ERC20

    const feeQuotes = feeQuotesOrDataResponse.feeQuotes as PaymasterFeeQuote[]
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const spender = feeQuotesOrDataResponse?.tokenPaymasterAddress!

    // Generate list of options for the user to select
    const choices = feeQuotes?.map((quote: any, index: number) => ({
      name: `Option ${index + 1}: ${quote.maxGasFee}: ${quote.symbol} `,
      value: index
    }))
    // Use inquirer to prompt user to select an option
    const { selectedOption } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedOption",
        message: "Select a fee quote:",
        choices
      }
    ])
    const selectedFeeQuote = feeQuotes[selectedOption]

    userOpResponse = await smartWallet.sendTransaction(transaction, {
      paymasterServiceData: {
        mode: PaymasterMode.ERC20,
        feeQuote: selectedFeeQuote,
        spender: spender,
        maxApproval: false
      }
    })
  } else if (feeQuotesOrDataResponse.paymasterAndData) {
    // this means sponsorship is successful
    userOpResponse = await smartWallet.sendTransaction(transaction, {
      paymasterServiceData: { mode: PaymasterMode.SPONSORED }
    })
  }

  console.log(chalk.green(`userOp Hash: ${userOpResponse?.userOpHash}`))
  const transactionDetails = await userOpResponse?.wait()
  console.log(
    chalk.blue(
      `transactionDetails: ${JSON.stringify(transactionDetails, null, "\t")}`
    )
  )
}
