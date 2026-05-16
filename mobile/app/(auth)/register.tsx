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
  ScrollView,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "../../lib/api";
import { getTempToken, deleteTempToken } from "../../lib/storage";
import { useAuthStore } from "../../store/auth";
import { T } from "../../constants/Theme";

export default function RegisterScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setAuth } = useAuthStore();

  const handleRegister = async () => {
    if (!name.trim()) {
      setError("Full name is required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const tempToken = await getTempToken();
      const { data } = await api.post(
        "/auth/register/patient",
        {
          name: name.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
        },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      await deleteTempToken();
      await setAuth(data.token, data.patient);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Registration failed");
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
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>DocVisit</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Create Account</Text>
          <Text style={styles.formSub}>Tell us a bit about yourself</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={[styles.input, error && !name ? styles.inputError : null]}
            placeholder="Ravi Kumar"
            placeholderTextColor={T.textMuted}
            value={name}
            onChangeText={(t) => { setName(t); setError(""); }}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="ravi@example.com  (optional)"
            placeholderTextColor={T.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Home Address</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Flat 4B, Green Park, Mumbai  (optional)"
            placeholderTextColor={T.textMuted}
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Get Started</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  inner: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 48 },
  logoWrap: { alignItems: "center", marginBottom: 36 },
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
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: T.textSec,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: T.text,
    marginBottom: 16,
  },
  multiline: { height: 84, textAlignVertical: "top" },
  inputError: { borderColor: T.error },
  error: { color: T.error, fontSize: 13, marginBottom: 12 },
  btn: {
    backgroundColor: T.teal,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
