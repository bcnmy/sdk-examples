import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// for ethers
import "react-native-get-random-values";
import "@ethersproject/shims";
import { ethers } from "ethers";
// for web3Auth
import SocialLogin from "@biconomy/web3-auth-native";
import * as WebBrowser from "expo-web-browser";
import Constants, { AppOwnership } from "expo-constants";
import * as Linking from "expo-linking";

global.Buffer = global.Buffer || require("buffer").Buffer;
const scheme = "bico_web3Auth";
const resolvedRedirectUrl =
  Constants.appOwnership == AppOwnership.Expo ||
  Constants.appOwnership == AppOwnership.Guest
    ? Linking.createURL("web3auth", {})
    : Linking.createURL("web3auth", { scheme: scheme });

const App = () => {
  const [eoa, setEoa] = useState("");
  const [pvrKey, setPvrKey] = useState("");
  const [provider, setProvider] =
    useState<ethers.providers.JsonRpcProvider | null>(null);

  const login = async (signInVia: string) => {
    try {
      console.log("web3Auth login");

      const web3auth = new SocialLogin({
        webBrowser: WebBrowser,
        initParams: {},
      });

      const signature1 = await web3auth.whitelistUrl(
        "exp://192.168.0.103:19000"
      );

      const state = await web3auth.login({
        loginProvider: signInVia,
        redirectUrl: resolvedRedirectUrl,
        originData: {
          "exp://192.168.0.103:19000": signature1,
        },
      });

      if (!state.privKey) {
        throw new Error("No private key found");
      }
      setPvrKey(state.privKey || "no key");
      console.log(state);
      const provider = new ethers.providers.JsonRpcProvider(
        "https://goerli.infura.io/v3/196440d5d02d41dfa2a8ee5bfd2e96bd"
      );
      const wallet = new ethers.Wallet(state.privKey, provider);
      setProvider(provider);
      const address = await wallet.getAddress();
      setEoa(address);
      console.log(address);
      // geenrate provider from private key ethers
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.mainText}>Biconomy SDK Example</Text>

      <View style={styles.smallCont}>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => login("google")}
        >
          <Text style={styles.buttonText}>Connect Wallet via Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => login("facebook")}
        >
          <Text style={styles.buttonText}>Connect Wallet via Facebook</Text>
        </TouchableOpacity>
        <Text style={styles.text}>Wallet Info:</Text>
        <Text style={styles.text}>{eoa}</Text>

        <Text style={styles.text}>{pvrKey}</Text>
      </View>
    </ScrollView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: "40%",
  },
  mainText: {
    fontSize: 26,
    marginTop: 30,
    color: "#051d5f",
  },
  smallCont: {
    marginTop: 50,
    width: "90%",
  },
  buttonContainer: {
    marginBottom: 10,
    padding: 10,
    paddingLeft: 15,
    paddingRight: 15,
    alignSelf: "center",
    borderRadius: 50,
    backgroundColor: "#2e64e5",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  text: {
    fontSize: 14,
    color: "#051d5f",
    marginBottom: 10,
  },
});
