import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TextInput, Pressable, StyleSheet } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "@/services/supabase";
import { Student } from "@/types";

interface StudentRow extends Student {
  courses: { name: string } | null;
}

export default function StudentsListScreen() {
  const navigation = useNavigation<any>();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState("");

  const load = useCallback(async (q: string) => {
    let query = supabase
      .from("students")
      .select("*, courses(name)")
      .order("admission_date", { ascending: false })
      .limit(100);

    if (q.trim()) {
      query = query.or(`name.ilike.%${q}%,mobile.ilike.%${q}%,student_code.ilike.%${q}%`);
    }

    const { data } = await query;
    if (data) setStudents(data as unknown as StudentRow[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(search);
    }, [load, search])
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search name, mobile, student ID..."
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => load(search)}
      />

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingTop: 0 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("StudentDetail", { studentId: item.id })}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.student_code} · {item.courses?.name ?? "No course"}
            </Text>
            <View style={styles.footerRow}>
              <Text style={styles.batch}>{item.batch ?? "No batch"}</Text>
              <Text style={[styles.status, statusColor(item.status)]}>
                {item.status.replace(/_/g, " ")}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No students yet. Students are created automatically when a lead's status
            becomes "Admission Confirmed".
          </Text>
        }
      />
    </View>
  );
}

function statusColor(status: string) {
  if (status === "active") return { color: "#16A34A" };
  if (status === "dropped") return { color: "#DC2626" };
  if (status === "on_hold") return { color: "#D97706" };
  return { color: "#64748B" };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  search: {
    margin: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  name: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  meta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6
  },
  batch: { fontSize: 11, color: "#94A3B8" },
  status: { fontSize: 11, fontWeight: "700" },
  empty: { textAlign: "center", color: "#94A3B8", marginTop: 40, paddingHorizontal: 24 }
});
