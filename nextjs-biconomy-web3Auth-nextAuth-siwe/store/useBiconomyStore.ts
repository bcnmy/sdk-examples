import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import localForage from "localforage";
import createSelectors from "./selectors";

import { ethers } from "ethers";
import SmartAccount from "@biconomy/smart-account";
import { ChainId } from "@biconomy/core-types";
import { ExternalProvider } from "@ethersproject/providers";

interface BiconomyState {
  account: string | null;
  smartAccountAddress: string | null;
  smartAccountLoading: boolean;
}

type BiconomyActions = {
  setupBiconomy: (chainId: ChainId) => void;
  setupProviderAndAccount: (sdkProvider: ExternalProvider) => any;
  setupSmartAccount: (
    provider: ethers.providers.Web3Provider,
    chainId: ChainId
  ) => void;
  reset: () => void;
};

// define the initial state
const initialState: BiconomyState = {
  account: null,
  smartAccountAddress: null,
  smartAccountLoading: false,
};

const useBiconomyStore = create<BiconomyState & BiconomyActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      setupBiconomy: async (chaindId) => {
        try {
          // here would mean the user is already logged in to biconomy and smart account is already initialized
          if (window.biconomySmartAccount) return;
          set({ smartAccountLoading: true });
          if (!window.biconomySocialLogin)
            throw new Error("Biconomy Social Login not initialized");
          const sdkProvider = window.biconomySocialLogin?.provider;
          // here would mean the user is not logged in to biconomy yet
          if (!sdkProvider) return;
          const { setupProviderAndAccount, setupSmartAccount } = get();
          const provider = await setupProviderAndAccount(sdkProvider);
          await setupSmartAccount(provider, chaindId);
        } catch (error) {
          throw error;
        } finally {
          set({ smartAccountLoading: false });
        }
      },
      setupProviderAndAccount: async (sdkProvider) => {
        try {
          const provider = new ethers.providers.Web3Provider(sdkProvider);
          const accounts = await provider.listAccounts();
          console.log("accounts", accounts, "provider", provider);
          const { account: existingAccount } = get();
          if (existingAccount !== accounts[0]) set({ account: accounts[0] });
          return provider;
        } catch (error) {
          throw error;
        }
      },
      setupSmartAccount: async (provider, chainId) => {
        try {
          const { account } = get();
          if (!provider || !account)
            throw new Error("Provider or account not set");
          if (!window.biconomySmartAccount) {
            const smartAccountSdk = new SmartAccount(provider, {
              activeNetworkId: chainId,
              supportedNetworksIds: [chainId],
              networkConfig: [
                {
                chainId,
                //https://biconomy.gitbook.io/sdk/sdk-reference/sending-transactions/gasless-transactions
                dappAPIKey: '59fRCMXvk.8a1652f0-b522-4ea7-b296-98628499aee3',
                // check in the beginning of the page to play around with testnet common keys
                // customPaymasterAPI: <IPaymaster Instance of your own Paymaster>
              }
            ]
            });
            window.biconomySmartAccount = smartAccountSdk;
            console.log({ smartAccountSdk });
            await smartAccountSdk.init();
            const context = smartAccountSdk.getSmartAccountContext();
            const smartAccountAddress = context.baseWallet.getAddress();
            window.biconomySmartAccount = smartAccountSdk;
            set({ smartAccountAddress });
            console.log("smartAccountAddress", smartAccountAddress);
          }
        } catch (error) {
          throw error;
        }
      },
      reset: () => {
        set(initialState);
        delete window.biconomySmartAccount;
        delete window.biconomySocialLogin;
      },
    }),
    {
      name: "biconomy-storage", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // see here if need to use IndexedDB or Ionic Storage https://docs.pmnd.rs/zustand/integrations/persisting-store-data#how-can-i-use-a-custom-storage-engine?
      // getStorage: () => localForage as never,
      onRehydrateStorage: (state) => {
        console.log("hydration starts");
        // optional
        return (state, error) => {
          if (error) {
            console.log("an error happened during hydration", error);
          } else {
            console.log("hydration finished");
          }
        };
      },
    }
  )
);

export default createSelectors(useBiconomyStore);
