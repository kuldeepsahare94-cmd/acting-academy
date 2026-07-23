import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
  Modal
} from "react-native";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";
import { Workshop, Attendance } from "@/types";

interface AttendeeRow {
  id: string; // workshop_attendees row id
  attendance: Attendance;
  students: { id: string; name: string; mobile: string } | null;
}

interface StudentSearchResult {
  id: string;
  name: string;
  mobile: string;
}

export default function WorkshopDetailScreen() {
  const route = useRoute<any>();
  const { workshopId } = route.params;

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [registerVisible, setRegisterVisible] = useState(false);

  const load = useCallback(async () => {
    const [{ data: w }, { data: a }] = await Promise.all([
      supabase.from("workshops").select("*").eq("id", workshopId).single(),
      supabase
        .from("workshop_attendees")
        .select("id, attendance, students(id, name, mobile)")
        .eq("workshop_id", workshopId)
    ]);
    if (w) setWorkshop(w as Workshop);
    if (a) setAttendees(a as unknown as AttendeeRow[]);
  }, [workshopId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const setAttendance = async (attendeeId: string, attendance: Attendance) => {
    const { error } = await supabase
      .from("workshop_attendees")
      .update({ attendance })
      .eq("id", attendeeId);
    if (error) {
      Alert.alert("Couldn't update attendance", error.message);
      return;
    }
    load();
  };

  if (!workshop) {
    return (
      <View style={styles.center}>
        <Text>Loading workshop...</Text>
      </View>
    );
  }

  const presentCount = attendees.filter((a) => a.attendance === "present").length;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.name}>{workshop.name}</Text>
          <Text style={styles.meta}>
            {workshop.date} · {workshop.start_time}–{workshop.end_time}
          </Text>
          <Text style={styles.meta}>
            {workshop.venue ?? "No venue"} · Trainer: {workshop.trainer ?? "—"}
          </Text>
          <Text style={styles.meta}>
            {attendees.length}
            {workshop.capacity ? ` / ${workshop.capacity}` : ""} registered · {presentCount} present
          </Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Attendees</Text>
          <Pressable style={styles.registerButton} onPress={() => setRegisterVisible(true)}>
            <Ionicons name="person-add-outline" size={14} color="#0F172A" />
            <Text style={styles.registerButtonText}>Register Student</Text>
          </Pressable>
        </View>

        {attendees.length === 0 && (
          <Text style={styles.empty}>No students registered yet.</Text>
        )}

        {attendees.map((a) => (
          <View key={a.id} style={styles.attendeeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.attendeeName}>{a.students?.name ?? "Unknown"}</Text>
              <Text style={styles.attendeeMobile}>{a.students?.mobile}</Text>
            </View>
            <View style={styles.attendanceButtons}>
              <Pressable
                style={[
                  styles.attendanceButton,
                  a.attendance === "present" && styles.attendancePresent
                ]}
                onPress={() => setAttendance(a.id, "present")}
              >
                <Text
                  style={[
                    styles.attendanceButtonText,
                    a.attendance === "present" && styles.attendanceButtonTextActive
                  ]}
                >
                  Present
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.attendanceButton,
                  a.attendance === "absent" && styles.attendanceAbsent
                ]}
                onPress={() => setAttendance(a.id, "absent")}
              >
                <Text
                  style={[
                    styles.attendanceButtonText,
                    a.attendance === "absent" && styles.attendanceButtonTextActive
                  ]}
                >
                  Absent
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <RegisterStudentModal
        visible={registerVisible}
        workshopId={workshopId}
        alreadyRegisteredIds={attendees.map((a) => a.students?.id).filter(Boolean) as string[]}
        onClose={() => setRegisterVisible(false)}
        onRegistered={() => {
          setRegisterVisible(false);
          load();
        }}
      />
    </View>
  );
}

function RegisterStudentModal({
  visible,
  workshopId,
  alreadyRegisteredIds,
  onClose,
  onRegistered
}: {
  visible: boolean;
  workshopId: string;
  alreadyRegisteredIds: string[];
  onClose: () => void;
  onRegistered: () => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<StudentSearchResult[]>([]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const { data } = await supabase
      .from("students")
      .select("id, name, mobile")
      .or(`name.ilike.%${q}%,mobile.ilike.%${q}%`)
      .limit(20);
    if (data) setResults(data as StudentSearchResult[]);
  }, []);

  const register = async (studentId: string) => {
    const { error } = await supabase.from("workshop_attendees").insert({
      workshop_id: workshopId,
      student_id: studentId
    });
    if (error) {
      Alert.alert("Couldn't register student", error.message);
      return;
    }
    setSearch("");
    setResults([]);
    onRegistered();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Register a Student</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or mobile..."
            value={search}
            onChangeText={(v) => {
              setSearch(v);
              runSearch(v);
            }}
            autoFocus
          />
          <FlatList
            data={results.filter((r) => !alreadyRegisteredIds.includes(r.id))}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 320 }}
            renderItem={({ item }) => (
              <Pressable style={styles.resultRow} onPress={() => register(item.id)}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultMobile}>{item.mobile}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              search.trim() ? (
                <Text style={styles.empty}>No matching students.</Text>
              ) : null
            }
          />
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  name: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  meta: { fontSize: 13, color: "#64748B", marginTop: 4 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 8
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 10
  },
  registerButtonText: { fontSize: 11, fontWeight: "700", color: "#0F172A" },
  empty: { color: "#94A3B8" },
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  attendeeName: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  attendeeMobile: { fontSize: 12, color: "#64748B", marginTop: 2 },
  attendanceButtons: { flexDirection: "row", gap: 6 },
  attendanceButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10
  },
  attendancePresent: { backgroundColor: "#16A34A", borderColor: "#16A34A" },
  attendanceAbsent: { backgroundColor: "#DC2626", borderColor: "#DC2626" },
  attendanceButtonText: { fontSize: 11, fontWeight: "600", color: "#334155" },
  attendanceButtonTextActive: { color: "#fff" },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%"
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#0F172A" },
  searchInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10
  },
  resultRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  resultName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  resultMobile: { fontSize: 12, color: "#64748B", marginTop: 2 },
  cancelButton: { alignItems: "center", paddingVertical: 14 },
  cancelButtonText: { color: "#64748B", fontSize: 14, fontWeight: "600" }
});
