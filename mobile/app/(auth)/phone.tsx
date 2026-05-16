import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { T } from "../../constants/Theme";

export default function PhoneScreen() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      setError("Enter a valid 10-digit number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/send-otp", { phone: cleaned });
      router.push({ pathname: "/(auth)/otp", params: { phone: cleaned } });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <View style={styles.inner}>
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>DocVisit</Text>
          <Text style={styles.logoSub}>Doctor at your doorstep</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Welcome back</Text>
          <Text style={styles.formSub}>Sign in with your mobile number</Text>

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="+91 98765 43210"
            placeholderTextColor={T.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(t) => { setPhone(t); setError(""); }}
            maxLength={15}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSendOtp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  logoWrap: { alignItems: "center", marginBottom: 48 },
  logo: {
    fontSize: 40,
    fontWeight: "800",
    color: T.teal,
    letterSpacing: -1,
  },
  logoSub: { fontSize: 14, color: T.textSec, marginTop: 6 },
  form: {
    backgroundColor: T.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: T.border,
  },
  formTitle: { fontSize: 20, fontWeight: "700", color: T.text, marginBottom: 4 },
  formSub: { fontSize: 13, color: T.textSec, marginBottom: 24 },
  label: { fontSize: 12, fontWeight: "600", color: T.textSec, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: T.text,
    marginBottom: 8,
  },
  inputError: { borderColor: T.error },
  error: { color: T.error, fontSize: 13, marginBottom: 12 },
  btn: {
    backgroundColor: T.teal,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
