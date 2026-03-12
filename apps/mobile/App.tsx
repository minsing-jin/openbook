import React from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const OPENBOOK_WEB_URL = process.env.EXPO_PUBLIC_OPENBOOK_WEB_URL ?? "http://localhost:3000/library";

export default function App() {
  const canLoadWebView = /^https?:\/\//.test(OPENBOOK_WEB_URL);

  if (!canLoadWebView) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.messageCard}>
          <Text style={styles.title}>OpenBook mobile shell</Text>
          <Text style={styles.body}>
            Set EXPO_PUBLIC_OPENBOOK_WEB_URL to the running web app URL to load the tablet reader shell.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView source={{ uri: OPENBOOK_WEB_URL }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2efe8"
  },
  messageCard: {
    margin: 24,
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#fffaf2",
    borderWidth: 1,
    borderColor: "#d9cfbf",
    gap: 12
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#30261d"
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: "#5d5042"
  }
});
