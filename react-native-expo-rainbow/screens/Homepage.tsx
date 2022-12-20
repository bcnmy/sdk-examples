import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import Web3Auth, {
  LOGIN_PROVIDER,
  OPENLOGIN_NETWORK,
} from "@web3auth/react-native-sdk";
import * as WebBrowser from "expo-web-browser";
import Constants, { AppOwnership } from "expo-constants";
import * as Linking from "expo-linking";
import { Buffer } from "buffer";

global.Buffer = global.Buffer || Buffer;

const scheme = "web3authrnsample"; // Or your desired app redirection scheme

const resolvedRedirectUrl =
  Constants.appOwnership == AppOwnership.Expo ||
  Constants.appOwnership == AppOwnership.Guest
    ? Linking.createURL("web3auth", {})
    : Linking.createURL("web3auth", { scheme: scheme });

const Homepage = () => {
  const [eoa, setEoa] = useState("0x42138576848E839827585A3539305774D36B9602");
  const [socialLoginSDK, setSocialLoginSDK] = useState();
  const [smartAccountSDK, setSmartAccountSDK] = useState();
  const [socailLoading, setSocailLoading] = useState(false);
  const [scwLoading, setScwLoading] = useState(false);

  const [key, setKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const login = async () => {
    try {
      console.log("here");
      const web3auth = new Web3Auth(WebBrowser, {
        clientId: `BEQgHQ6oRgaJXc3uMnGIr-AY-FLTwRinuq8xfgnInrnDrQZYXxDO0e53osvXzBXC1dcUTyD2Itf-zN1VEB8xZlo`,
        network: OPENLOGIN_NETWORK.TESTNET,
        originData: {
          "exp://192.168.0.104:19000":
            "MEQCICJf-zJJkV4iyGBWiKqEUvbGSd0hyQrV2mz5IxtDy10eAiAv_Xpcgm-ImTg3ohGOsX1Wo7ePlHUegyKuBMpvPUyvbQ",
        },
      } as any);

      const state = await web3auth.login({
        loginProvider: LOGIN_PROVIDER.GOOGLE,
        redirectUrl: resolvedRedirectUrl,
      });

      setKey(state.privKey || "no key");
    } catch (e) {
      console.error(e);
      setErrorMsg(String(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.mainText}>Biconomy SDK Example</Text>

      <View style={styles.smallCont}>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => login()}
        >
          <Text style={styles.buttonText}>Connect Wallet</Text>
        </TouchableOpacity>
        <Text style={styles.text}>Wallet Info:</Text>
        <Text style={styles.text}>{eoa}</Text>
      </View>

      {/* <View
        style={{
          height: 1,
          width: "100%",
          backgroundColor: "black",
          marginTop: 50,
        }}
      >
        <Text></Text>
      </View> */}

      <View style={styles.smallCont}>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => {
            try {
              console.log("here");
            } catch (error) {
              console.log(error);
            }
          }}
        >
          <Text style={styles.buttonText}>Init Smart Account</Text>
        </TouchableOpacity>
        <Text style={styles.text}>SCW Info:</Text>
        <Text style={styles.text}>{eoa}</Text>
      </View>
    </ScrollView>
  );
};

export default Homepage;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  mainText: {
    fontSize: 26,
    marginTop: 30,
    color: "#051d5f",
  },
  smallCont: {
    marginTop: 50,
    width: "70%",
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
