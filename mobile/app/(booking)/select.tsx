import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "../../lib/api";
import { T } from "../../constants/Theme";

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  home_visit_price: number;
  call_price: number;
  avg_rating: number;
  is_online: boolean;
};

export default function SelectBookingScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [type, setType] = useState<"home_visit" | "call">("home_visit");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api
      .get(`/doctors/${doctorId}`)
      .then(({ data }) => setDoctor(data.doctor ?? data))
      .finally(() => setLoading(false));
  }, [doctorId]);

  const handleBook = async () => {
    if (type === "home_visit" && !address.trim()) {
      Alert.alert("Address required", "Please enter your home address for a home visit.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/bookings", {
        doctorId,
        type,
        address: type === "home_visit" ? address.trim() : undefined,
      });
      router.replace("/(tabs)/bookings");
    } catch (e: any) {
      Alert.alert("Booking failed", e?.response?.data?.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={T.teal} size="large" />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.notFound}>Doctor not found</Text>
      </View>
    );
  }

  const price = type === "home_visit" ? doctor.home_visit_price : doctor.call_price;
  const isCall = type === "call";

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />

      {/* Doctor info card */}
      <View style={styles.doctorCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{doctor.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>Dr. {doctor.name}</Text>
          <Text style={styles.specialty}>{doctor.specialty}</Text>
          {doctor.avg_rating > 0 && (
            <Text style={styles.rating}>★ {Number(doctor.avg_rating).toFixed(1)}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, doctor.is_online ? styles.badgeOnline : styles.badgeOffline]}>
          <View style={[styles.dot, doctor.is_online ? styles.dotOnline : styles.dotOffline]} />
          <Text style={[styles.statusText, doctor.is_online ? styles.textOnline : styles.textOffline]}>
            {doctor.is_online ? "Active" : "Offline"}
          </Text>
        </View>
      </View>

      {/* Type selector */}
      <Text style={styles.sectionLabel}>Consultation Type</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeCard, !isCall && styles.typeCardTealActive]}
          onPress={() => setType("home_visit")}
          activeOpacity={0.8}
        >
          <Text style={styles.typeIcon}>🏠</Text>
          <Text style={[styles.typeLabel, !isCall && styles.typeLabelTeal]}>Home Visit</Text>
          <Text style={[styles.typePrice, !isCall && styles.typePriceTeal]}>
            ₹{doctor.home_visit_price}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeCard, isCall && styles.typeCardPurpleActive]}
          onPress={() => setType("call")}
          activeOpacity={0.8}
        >
          <Text style={styles.typeIcon}>📹</Text>
          <Text style={[styles.typeLabel, isCall && styles.typeLabelPurple]}>Video Call</Text>
          <Text style={[styles.typePrice, isCall && styles.typePricePurple]}>
            ₹{doctor.call_price}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Address field (home visit only) */}
      {!isCall && (
        <View>
          <Text style={styles.sectionLabel}>Your Address</Text>
          <TextInput
            style={styles.addressInput}
            placeholder="Flat 4B, Green Park, Mumbai 400001"
            placeholderTextColor={T.textMuted}
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />
        </View>
      )}

      {/* Fee summary */}
      <View style={styles.feeSummary}>
        <Text style={styles.feeLabel}>Consultation Fee</Text>
        <Text style={[styles.feeAmount, isCall ? styles.feeAmountPurple : styles.feeAmountTeal]}>
          ₹{price}
        </Text>
      </View>

      {/* Confirm button */}
      <TouchableOpacity
        style={[
          styles.confirmBtn,
          isCall ? styles.confirmBtnPurple : styles.confirmBtnTeal,
          submitting && styles.btnDisabled,
        ]}
        onPress={handleBook}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmBtnText}>
            {isCall ? "Book Video Call" : "Book Home Visit"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: T.bg },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: T.bg },
  notFound: { color: T.textMuted, fontSize: 16 },

  doctorCard: {
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.tealMuted,
    borderWidth: 1,
    borderColor: T.teal,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: { fontSize: 24, fontWeight: "700", color: T.teal },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: "700", color: T.text },
  specialty: { fontSize: 13, color: T.textSec, textTransform: "capitalize", marginTop: 2 },
  rating: { fontSize: 13, color: T.amber, fontWeight: "600", marginTop: 3 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeOnline: { backgroundColor: T.onlineMuted },
  badgeOffline: { backgroundColor: "rgba(74,96,128,0.2)" },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotOnline: { backgroundColor: T.online },
  dotOffline: { backgroundColor: T.offline },
  statusText: { fontSize: 12, fontWeight: "700" },
  textOnline: { color: T.online },
  textOffline: { color: T.offline },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: T.textSec,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  typeRow: { flexDirection: "row", gap: 12 },
  typeCard: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: T.border,
  },
  typeCardTealActive: { borderColor: T.teal, backgroundColor: T.tealMuted },
  typeCardPurpleActive: { borderColor: T.purple, backgroundColor: T.purpleMuted },
  typeIcon: { fontSize: 28, marginBottom: 8 },
  typeLabel: { fontSize: 14, fontWeight: "600", color: T.textSec },
  typeLabelTeal: { color: T.teal },
  typeLabelPurple: { color: T.purple },
  typePrice: { fontSize: 18, fontWeight: "800", color: T.textSec, marginTop: 4 },
  typePriceTeal: { color: T.teal },
  typePricePurple: { color: T.purple },

  addressInput: {
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: T.text,
    height: 88,
    textAlignVertical: "top",
  },

  feeSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: T.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  feeLabel: { fontSize: 15, color: T.textSec, fontWeight: "600" },
  feeAmount: { fontSize: 22, fontWeight: "800" },
  feeAmountTeal: { color: T.teal },
  feeAmountPurple: { color: T.purple },

  confirmBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmBtnTeal: { backgroundColor: T.teal },
  confirmBtnPurple: { backgroundColor: T.purple },
  btnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
