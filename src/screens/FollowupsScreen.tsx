import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { supabase } from "@/services/supabase";

interface FollowupRow {
  id: string;
  lead_id: string;
  date: string;
  time: string;
  type: string;
  priority: string;
  notes: string | null;
  completed: boolean;
  leads: { name: string; mobile: string } | null;
}

type Mode = "all" | "today" | "missed";

export default function FollowupsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [rows, setRows] = useState<FollowupRow[]>([]);
  const [mode, setMode] = useState<Mode>("all");

  // Dashboard's "Followups Today" / "Missed Followups" cards land here with
  // { mode: 'today' | 'missed' }. Adopt it, then clear the param so it
  // doesn't stick around after the user navigates away and back manually.
  useEffect(() => {
    const incomingMode = route.params?.mode as Mode | undefined;
    if (incomingMode) {
      setMode(incomingMode);
      navigation.setParams({ mode: undefined });
    }
  }, [route.params, navigation]);

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    let query = supabase
      .from("followups")
      .select("*, leads(name, mobile)")
      .eq("completed", false)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (mode === "today") {
      query = query.eq("date", today);
    } else if (mode === "missed") {
      query = query.lt("date", today);
    } else {
      query = query.lte("date", today);
    }

    const { data } = await query;
    if (data) setRows(data as unknown as FollowupRow[]);
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <View style={{ flex: 1 }}>
      {mode !== "all" && (
        <View style={styles.drillBanner}>
          <Text style={styles.drillBannerText}>
            {mode === "today" ? "Today's followups" : "Missed followups"}
          </Text>
          <Pressable onPress={() => setMode("all")}>
            <Text style={styles.drillBannerClear}>Show all</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        style={styles.container}
        data={rows}
        keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const missed = item.date < today;
        return (
          <Pressable
            style={[styles.row, missed && styles.missedRow]}
            onPress={() =>
              navigation.navigate("LeadDetail", { leadId: item.lead_id })
            }
          >
            <Text style={styles.name}>{item.leads?.name ?? "Unknown lead"}</Text>
            <Text style={styles.meta}>
              {item.date} {item.time} · {item.type} · {item.priority} priority
            </Text>
            {missed && <Text style={styles.missedTag}>MISSED FOLLOWUP</Text>}
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <Text style={styles.empty}>No pending followups. Nice work.</Text>
      }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 12 },
  drillBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    marginHorizontal: 12,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  drillBannerText: { color: "#3730A3", fontWeight: "600", fontSize: 12 },
  drillBannerClear: { color: "#3730A3", fontWeight: "700", fontSize: 12, textDecorationLine: "underline" },
  row: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  missedRow: { borderColor: "#DC2626", borderWidth: 1.5 },
  name: { fontWeight: "700", fontSize: 14, color: "#0F172A" },
  meta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  missedTag: { fontSize: 10, fontWeight: "800", color: "#DC2626", marginTop: 6 },
  notes: { fontSize: 12, color: "#334155", marginTop: 6 },
  empty: { textAlign: "center", color: "#94A3B8", marginTop: 40 }
});
