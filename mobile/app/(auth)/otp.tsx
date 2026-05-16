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
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "../../lib/api";
import { saveTempToken } from "../../lib/storage";
import { useAuthStore } from "../../store/auth";
import { T } from "../../constants/Theme";

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const handleVerify = async () => {
    if (otp.length < 4) {
      setError("Enter the OTP sent to your number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { phone, otp });
      if (data.token) {
        await setAuth(data.token, data.patient);
      } else if (data.tempToken) {
        await saveTempToken(data.tempToken);
        router.push({ pathname: "/(auth)/register", params: { phone } });
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Invalid or expired OTP");
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
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Verify OTP</Text>
          <Text style={styles.formSub}>
            Sent to{" "}
            <Text style={styles.phoneHighlight}>{phone}</Text>
          </Text>

          <TextInput
            style={[styles.otpInput, error ? styles.inputError : null]}
            placeholder="------"
            placeholderTextColor={T.textMuted}
            keyboardType="number-pad"
            value={otp}
            onChangeText={(t) => { setOtp(t); setError(""); }}
            maxLength={6}
            textAlign="center"
            autoFocus
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>Change number</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  logoWrap: { alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 36, fontWeight: "800", color: T.teal, letterSpacing: -1 },
  form: {
    backgroundColor: T.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: T.border,
  },
  formTitle: { fontSize: 20, fontWeight: "700", color: T.text, marginBottom: 4 },
  formSub: { fontSize: 13, color: T.textSec, marginBottom: 24 },
  phoneHighlight: { color: T.teal, fontWeight: "700" },
  otpInput: {
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    paddingVertical: 18,
    fontSize: 32,
    fontWeight: "700",
    color: T.text,
    letterSpacing: 14,
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
  backBtn: { alignItems: "center", marginTop: 20 },
  backText: { color: T.teal, fontSize: 14, fontWeight: "600" },
});
