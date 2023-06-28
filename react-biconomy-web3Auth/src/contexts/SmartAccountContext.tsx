import React, { useCallback, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import SmartAccount from "@biconomy/smart-account";
import { SmartAccountState, SmartAccountVersion } from "@biconomy/core-types";
import { supportedChains, activeChainId } from "../utils/chainConfig";
import { useWeb3AuthContext } from "./SocialLoginContext";

export const ChainId = {
  MAINNET: 1, // Ethereum
  GOERLI: 5,
  POLYGON_MUMBAI: 80001,
  POLYGON_MAINNET: 137,
};

// Types
type Balance = {
  totalBalanceInUsd: number;
  alltokenBalances: any[];
};
type ISmartAccount = {
  version: string;
  smartAccountAddress: string;
  isDeployed: boolean;
};
type smartAccountContextType = {
  wallet: SmartAccount | null;
  state: SmartAccountState | null;
  balance: Balance;
  loading: boolean;
  isFetchingBalance: boolean;
  selectedAccount: ISmartAccount | null;
  smartAccountsArray: ISmartAccount[];
  setSelectedAccount: React.Dispatch<
    React.SetStateAction<ISmartAccount | null>
  >;
  getSmartAccount: () => Promise<string>;
  getSmartAccountBalance: () => Promise<string>;
};

// Context
export const SmartAccountContext = React.createContext<smartAccountContextType>(
  {
    wallet: null,
    state: null,
    balance: {
      totalBalanceInUsd: 0,
      alltokenBalances: [],
    },
    loading: false,
    isFetchingBalance: false,
    selectedAccount: null,
    smartAccountsArray: [],
    setSelectedAccount: () => {},
    getSmartAccount: () => Promise.resolve(""),
    getSmartAccountBalance: () => Promise.resolve(""),
  }
);
export const useSmartAccountContext = () => useContext(SmartAccountContext);

// Provider
export const SmartAccountProvider = ({ children }: any) => {
  const { provider, address } = useWeb3AuthContext();
  const [wallet, setWallet] = useState<SmartAccount | null>(null);
  const [state, setState] = useState<SmartAccountState | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<ISmartAccount | null>(
    null
  );
  const [smartAccountsArray, setSmartAccountsArray] = useState<ISmartAccount[]>(
    []
  );
  const [balance, setBalance] = useState<Balance>({
    totalBalanceInUsd: 0,
    alltokenBalances: [],
  });
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [loading, setLoading] = useState(false);

  const getSmartAccount = useCallback(async () => {
    if (!provider || !address) return "Wallet not connected";

    try {
      setLoading(true);
      const walletProvider = new ethers.providers.Web3Provider(provider);
      console.log("walletProvider", walletProvider);
      // New instance, all config params are optional
      const wallet = new SmartAccount(walletProvider, {
        activeNetworkId: activeChainId,
        supportedNetworksIds: supportedChains,
        networkConfig: [
          {
            chainId: ChainId.POLYGON_MUMBAI,
            dappAPIKey: "59fRCMXvk.8a1652f0-b522-4ea7-b296-98628499aee3",
          },
          {
            chainId: ChainId.POLYGON_MAINNET,
            // dappAPIKey: todo
          },
        ],
      });
      console.log("wallet", wallet);

      // Wallet initialization to fetch wallet info
      const smartAccount = await wallet.init();
      setWallet(wallet);
      console.info("smartAccount", smartAccount);

      smartAccount.on("txHashGenerated", (response: any) => {
        console.log(
          "txHashGenerated event received in AddLP via emitter",
          response
        );
      });

      smartAccount.on("txHashChanged", (response: any) => {
        console.log(
          "txHashChanged event received in AddLP via emitter",
          response
        );
      });

      smartAccount.on("txMined", (response: any) => {
        console.log("txMined event received in AddLP via emitter", response);
      });

      smartAccount.on("error", (response: any) => {
        console.log("error event received in AddLP via emitter", response);
      });

      // get all smart account versions available and update in state
      const { data } = await smartAccount.getSmartAccountsByOwner({
        chainId: activeChainId,
        owner: address,
      });
      console.info("getSmartAccountsByOwner", data);
      const accountData = [];
      for (let i = 0; i < data.length; ++i) {
        accountData.push(data[i]);
      }
      setSmartAccountsArray(accountData);
      // set the first wallet version as default
      if (accountData.length) {
        wallet.setSmartAccountVersion(
          accountData[0].version as SmartAccountVersion
        );
        setSelectedAccount(accountData[0]);
      }

      // get address, isDeployed and other data
      const state = await smartAccount.getSmartAccountState();
      setState(state);
      console.info("getSmartAccountState", state);

      setLoading(false);
      return "";
    } catch (error: any) {
      setLoading(false);
      console.error({ getSmartAccount: error });
      return error.message;
    }
  }, [provider, address]);

  const getSmartAccountBalance = async () => {
    if (!provider || !address) return "Wallet not connected";
    if (!state || !wallet) return "Init Smart Account First";

    try {
      setIsFetchingBalance(true);
      // ethAdapter could be used like this
      // const bal = await wallet.ethersAdapter().getBalance(state.address);
      // console.log(bal);
      // you may use EOA address my goerli SCW 0x1927366dA53F312a66BD7D09a88500Ccd16f175e
      const balanceParams = {
        chainId: activeChainId,
        eoaAddress: state.address,
        tokenAddresses: [],
      };
      const balFromSdk = await wallet.getAlltokenBalances(balanceParams);
      console.info("getAlltokenBalances", balFromSdk);

      const usdBalFromSdk = await wallet.getTotalBalanceInUsd(balanceParams);
      console.info("getTotalBalanceInUsd", usdBalFromSdk);
      setBalance({
        totalBalanceInUsd: usdBalFromSdk.data.totalBalance,
        alltokenBalances: balFromSdk.data,
      });
      setIsFetchingBalance(false);
      return "";
    } catch (error: any) {
      setIsFetchingBalance(false);
      console.error({ getSmartAccountBalance: error });
      return error.message;
    }
  };

  useEffect(() => {
    if (wallet && selectedAccount) {
      console.log("setSmartAccountVersion", selectedAccount);
      wallet.setSmartAccountVersion(
        selectedAccount.version as SmartAccountVersion
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

  useEffect(() => {
    getSmartAccount();
  }, [getSmartAccount]);

  return (
    <SmartAccountContext.Provider
      value={{
        wallet,
        state,
        balance,
        loading,
        isFetchingBalance,
        selectedAccount,
        smartAccountsArray,
        setSelectedAccount,
        getSmartAccount,
        getSmartAccountBalance,
      }}
    >
      {children}
    </SmartAccountContext.Provider>
  );
};
