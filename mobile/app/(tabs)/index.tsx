import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { T } from "../../constants/Theme";

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  home_visit_price: number;
  call_price: number;
  avg_rating: number;
  total_ratings: number;
  is_online: boolean;
};

const SPECIALTIES = [
  { label: "All", value: "" },
  { label: "General", value: "general" },
  { label: "Diabetes", value: "diabetes" },
  { label: "Cardiology", value: "cardiology" },
  { label: "Paediatrics", value: "paediatrics" },
  { label: "Orthopaedics", value: "orthopaedics" },
];

export default function HomeScreen() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchDoctors = useCallback(async () => {
    try {
      const params = specialty ? { specialty } : {};
      const { data } = await api.get("/doctors", { params });
      setDoctors(data.doctors ?? data);
    } catch {
      // silent — empty state shown
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [specialty]);

  useEffect(() => {
    setLoading(true);
    fetchDoctors();
  }, [fetchDoctors]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find a Doctor</Text>
        <Text style={styles.headerSub}>Book home visits & video calls</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {SPECIALTIES.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.chip, specialty === s.value && styles.chipActive]}
            onPress={() => setSpecialty(s.value)}
          >
            <Text style={[styles.chipText, specialty === s.value && styles.chipTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={T.teal} />
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchDoctors(); }}
              tintColor={T.teal}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No doctors found</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() =>
                router.push({ pathname: "/(booking)/select", params: { doctorId: item.id } })
              }
            >
              {/* Top row: avatar + info + status badge */}
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.doctorName}>Dr. {item.name}</Text>
                  <Text style={styles.specialty}>{item.specialty}</Text>
                  {(item.avg_rating > 0) && (
                    <View style={styles.ratingRow}>
                      <Text style={styles.star}>★</Text>
                      <Text style={styles.rating}>
                        {Number(item.avg_rating).toFixed(1)}
                      </Text>
                      {item.total_ratings > 0 && (
                        <Text style={styles.ratingCount}>
                          ({item.total_ratings})
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={[
                  styles.statusBadge,
                  item.is_online ? styles.badgeOnline : styles.badgeOffline,
                ]}>
                  <View style={[
                    styles.statusDot,
                    item.is_online ? styles.dotOnline : styles.dotOffline,
                  ]} />
                  <Text style={[
                    styles.statusText,
                    item.is_online ? styles.statusOnline : styles.statusOffline,
                  ]}>
                    {item.is_online ? "Active" : "Offline"}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Price row + book button */}
              <View style={styles.priceRow}>
                <View style={[styles.priceChip, styles.priceChipTeal]}>
                  <Text style={styles.priceChipLabel}>🏠 Home Visit</Text>
                  <Text style={styles.priceChipValue}>₹{item.home_visit_price}</Text>
                </View>
                <View style={[styles.priceChip, styles.priceChipPurple]}>
                  <Text style={styles.priceChipLabel}>📹 Video Call</Text>
                  <Text style={[styles.priceChipValue, styles.purpleText]}>₹{item.call_price}</Text>
                </View>
                <TouchableOpacity
                  style={styles.bookBtn}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({ pathname: "/(booking)/select", params: { doctorId: item.id } })
                  }
                >
                  <Text style={styles.bookBtnText}>Book</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: T.text },
  headerSub: { fontSize: 13, color: T.textSec, marginTop: 2 },

  chips: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  chipActive: { backgroundColor: T.tealMuted, borderColor: T.teal },
  chipText: { fontSize: 13, color: T.textSec, fontWeight: "600" },
  chipTextActive: { color: T.teal },

  list: { padding: 16, gap: 14 },
  empty: { textAlign: "center", color: T.textMuted, marginTop: 60, fontSize: 15 },

  card: {
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: T.tealMuted,
    borderWidth: 1,
    borderColor: T.teal,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 22, fontWeight: "700", color: T.teal },
  cardInfo: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: "700", color: T.text },
  specialty: {
    fontSize: 13,
    color: T.textSec,
    textTransform: "capitalize",
    marginTop: 2,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  star: { color: T.amber, fontSize: 13 },
  rating: { fontSize: 13, fontWeight: "700", color: T.text },
  ratingCount: { fontSize: 12, color: T.textMuted },

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
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  dotOnline: { backgroundColor: T.online },
  dotOffline: { backgroundColor: T.offline },
  statusText: { fontSize: 12, fontWeight: "700" },
  statusOnline: { color: T.online },
  statusOffline: { color: T.offline },

  divider: { height: 1, backgroundColor: T.border, marginVertical: 12 },

  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  priceChip: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  priceChipTeal: { backgroundColor: T.tealMuted, borderColor: "rgba(0,137,123,0.3)" },
  priceChipPurple: { backgroundColor: T.purpleMuted, borderColor: "rgba(156,143,255,0.3)" },
  priceChipLabel: { fontSize: 11, color: T.textSec, marginBottom: 2 },
  priceChipValue: { fontSize: 15, fontWeight: "800", color: T.teal },
  purpleText: { color: T.purple },
  bookBtn: {
    backgroundColor: T.teal,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  bookBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
