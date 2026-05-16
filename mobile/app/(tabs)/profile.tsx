import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { useAuthStore } from "../../store/auth";
import { api } from "../../lib/api";
import { T } from "../../constants/Theme";

export default function ProfileScreen() {
  const { patient, logout, setAuth, token } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(patient?.name ?? "");
  const [email, setEmail] = useState(patient?.email ?? "");
  const [address, setAddress] = useState(patient?.address ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name required");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put("/patients/me", {
        name: name.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });
      await setAuth(token!, data.patient);
      setEditing(false);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Avatar card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(patient?.name ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.patientName}>{patient?.name}</Text>
          <View style={styles.phoneBadge}>
            <Text style={styles.phoneText}>{patient?.phone}</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, !editing && styles.inputReadonly]}
            value={name}
            onChangeText={setName}
            editable={editing}
            placeholderTextColor={T.textMuted}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, !editing && styles.inputReadonly]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={editing}
            placeholder="Not set"
            placeholderTextColor={T.textMuted}
          />

          <Text style={styles.label}>Home Address</Text>
          <TextInput
            style={[styles.input, styles.multiline, !editing && styles.inputReadonly]}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            editable={editing}
            placeholder="Not set"
            placeholderTextColor={T.textMuted}
          />

          {editing && (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setName(patient?.name ?? "");
                  setEmail(patient?.email ?? "");
                  setAddress(patient?.address ?? "");
                  setEditing(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: T.text },
  editBtn: {
    backgroundColor: T.tealMuted,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: T.teal,
  },
  editBtnText: { color: T.teal, fontWeight: "700", fontSize: 13 },

  avatarCard: {
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: T.tealMuted,
    borderWidth: 2,
    borderColor: T.teal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: { fontSize: 32, fontWeight: "700", color: T.teal },
  patientName: { fontSize: 19, fontWeight: "800", color: T.text },
  phoneBadge: {
    marginTop: 8,
    backgroundColor: T.bg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: T.border,
  },
  phoneText: { fontSize: 13, color: T.textSec, fontWeight: "500" },

  section: {
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: T.border,
    gap: 6,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: T.teal, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  label: { fontSize: 12, fontWeight: "600", color: T.textSec, marginTop: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: T.text,
  },
  inputReadonly: { color: T.textSec, borderColor: "transparent" },
  multiline: { height: 76, textAlignVertical: "top" },

  btnRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: { color: T.textSec, fontWeight: "600" },
  saveBtn: {
    flex: 2,
    backgroundColor: T.teal,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#fff", fontWeight: "700" },

  logoutBtn: {
    backgroundColor: T.errorMuted,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,82,82,0.3)",
  },
  logoutText: { color: T.error, fontWeight: "700", fontSize: 15 },
});
