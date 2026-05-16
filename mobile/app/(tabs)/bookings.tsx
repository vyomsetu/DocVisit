import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
  Modal,
  StatusBar,
} from "react-native";
import { api } from "../../lib/api";
import { T } from "../../constants/Theme";

type Booking = {
  id: string;
  type: "home_visit" | "call";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  address?: string;
  created_at: string;
  doctor: { id: string; name: string; specialty: string };
  rating?: number;
};

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: T.amber,  bg: "rgba(255,179,0,0.15)"  },
  confirmed: { label: "Confirmed", color: T.teal,   bg: T.tealMuted              },
  completed: { label: "Completed", color: T.online, bg: T.onlineMuted            },
  cancelled: { label: "Cancelled", color: T.error,  bg: T.errorMuted             },
};

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingModal, setRatingModal] = useState<{ bookingId: string; doctorName: string } | null>(null);
  const [selectedStars, setSelectedStars] = useState(0);

  const fetchBookings = useCallback(async () => {
    try {
      const { data } = await api.get("/bookings");
      setBookings(data.bookings ?? data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const cancelBooking = (id: string) => {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await api.patch(`/bookings/${id}/cancel`);
            fetchBookings();
          } catch (e: any) {
            Alert.alert("Error", e?.response?.data?.message ?? "Failed to cancel");
          }
        },
      },
    ]);
  };

  const submitRating = async () => {
    if (!ratingModal || selectedStars === 0) return;
    try {
      await api.post(`/bookings/${ratingModal.bookingId}/rate`, { rating: selectedStars });
      setRatingModal(null);
      setSelectedStars(0);
      fetchBookings();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Failed to submit rating");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={T.teal} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchBookings(); }}
              tintColor={T.teal}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySub}>Book a doctor from the Find Doctors tab</Text>
            </View>
          }
          renderItem={({ item }) => {
            const s = STATUS[item.status];
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.doctor.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.doctorName}>Dr. {item.doctor.name}</Text>
                    <Text style={styles.specialty}>{item.doctor.specialty}</Text>
                    <View style={styles.typeRow}>
                      <Text style={item.type === "home_visit" ? styles.typeHome : styles.typeCall}>
                        {item.type === "home_visit" ? "🏠 Home Visit" : "📹 Video Call"}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.badge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
                  </View>
                </View>

                {item.address ? (
                  <View style={styles.addressRow}>
                    <Text style={styles.addressText} numberOfLines={2}>
                      📍 {item.address}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.footer}>
                  <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                  <View style={styles.actions}>
                    {(item.status === "pending" || item.status === "confirmed") && (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => cancelBooking(item.id)}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === "completed" && !item.rating && (
                      <TouchableOpacity
                        style={styles.rateBtn}
                        onPress={() =>
                          setRatingModal({ bookingId: item.id, doctorName: item.doctor.name })
                        }
                      >
                        <Text style={styles.rateBtnText}>Rate Doctor</Text>
                      </TouchableOpacity>
                    )}
                    {item.rating ? (
                      <Text style={styles.ratedText}>★ {item.rating}/5 rated</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal
        visible={!!ratingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingModal(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Rate Dr. {ratingModal?.doctorName}</Text>
            <Text style={styles.modalSub}>How was your experience?</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setSelectedStars(s)} activeOpacity={0.7}>
                  <Text style={[styles.starIcon, s <= selectedStars && styles.starActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setRatingModal(null); setSelectedStars(0); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, selectedStars === 0 && styles.btnDisabled]}
                onPress={submitRating}
                disabled={selectedStars === 0}
              >
                <Text style={styles.modalSubmitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  list: { padding: 16, gap: 14 },
  emptyWrap: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: T.textSec },
  emptySub: { fontSize: 13, color: T.textMuted, marginTop: 4, textAlign: "center" },

  card: {
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
    gap: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: T.tealMuted,
    borderWidth: 1,
    borderColor: T.teal,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: T.teal },
  cardInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: "700", color: T.text },
  specialty: { fontSize: 12, color: T.textSec, textTransform: "capitalize", marginTop: 1 },
  typeRow: { marginTop: 4 },
  typeHome: { fontSize: 12, color: T.teal, fontWeight: "600" },
  typeCall: { fontSize: 12, color: T.purple, fontWeight: "600" },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: "700" },

  addressRow: {
    backgroundColor: T.bg,
    borderRadius: 8,
    padding: 10,
  },
  addressText: { fontSize: 12, color: T.textSec },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: { fontSize: 12, color: T.textMuted },
  actions: { flexDirection: "row", gap: 8 },
  cancelBtn: {
    borderWidth: 1,
    borderColor: T.error,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  cancelBtnText: { color: T.error, fontWeight: "600", fontSize: 12 },
  rateBtn: {
    backgroundColor: "rgba(255,179,0,0.15)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,179,0,0.3)",
  },
  rateBtnText: { color: T.amber, fontWeight: "700", fontSize: 12 },
  ratedText: { fontSize: 12, color: T.amber, fontWeight: "700" },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: T.card,
    borderRadius: 20,
    padding: 28,
    width: "82%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: T.text, marginBottom: 4 },
  modalSub: { fontSize: 13, color: T.textSec, marginBottom: 24 },
  stars: { flexDirection: "row", gap: 10, marginBottom: 28 },
  starIcon: { fontSize: 38, color: T.border },
  starActive: { color: T.amber },
  modalBtns: { flexDirection: "row", gap: 12, width: "100%" },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  modalCancelText: { color: T.textSec, fontWeight: "600" },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: T.teal,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  modalSubmitText: { color: "#fff", fontWeight: "700" },
});
