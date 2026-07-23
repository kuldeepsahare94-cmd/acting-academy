import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";
import { Workshop } from "@/types";

export default function WorkshopsListScreen() {
  const navigation = useNavigation<any>();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("workshops")
      .select("*")
      .order("date", { ascending: true });
    if (data) setWorkshops(data as Workshop[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <View style={styles.container}>
      <FlatList
        data={workshops}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, item.date < today && styles.pastCard]}
            onPress={() => navigation.navigate("WorkshopDetail", { workshopId: item.id })}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.date} · {item.start_time}–{item.end_time}
            </Text>
            <Text style={styles.meta}>
              {item.venue ?? "No venue"} · Trainer: {item.trainer ?? "—"}
            </Text>
            {item.capacity ? (
              <Text style={styles.capacity}>Capacity: {item.capacity}</Text>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No workshops scheduled yet. Tap + to add one.</Text>
        }
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate("AddWorkshop")}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  pastCard: { opacity: 0.55 },
  name: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  meta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  capacity: { fontSize: 11, color: "#0F172A", marginTop: 4, fontWeight: "600" },
  empty: { textAlign: "center", color: "#94A3B8", marginTop: 40, paddingHorizontal: 24 },
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
