import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";
import { Course } from "@/types";

export default function CoursesListScreen() {
  const navigation = useNavigation<any>();
  const [courses, setCourses] = useState<Course[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCourses(data as Course[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.duration ?? "Duration not set"} · ₹{Number(item.fees).toLocaleString("en-IN")}
              </Text>
              {item.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </View>
            <View style={[styles.statusDot, item.active ? styles.activeDot : styles.inactiveDot]} />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No courses yet. Tap + to add one.</Text>
        }
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate("AddCourse")}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  name: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  meta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  description: { fontSize: 12, color: "#334155", marginTop: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  activeDot: { backgroundColor: "#16A34A" },
  inactiveDot: { backgroundColor: "#CBD5E1" },
  empty: { textAlign: "center", color: "#94A3B8", marginTop: 40 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4
  }
});
