import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "@/services/supabase";

interface Counts {
  todaysLeads: number;
  unassigned: number;
  followupsToday: number;
  missedFollowups: number;
  admissionsToday: number;
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10);

      const [
        { count: todaysLeads },
        { count: unassigned },
        { count: followupsToday },
        { count: missedFollowups },
        { count: admissionsToday }
      ] = await Promise.all([
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .gte("created_at", today),
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .is("assigned_user_id", null),
        supabase
          .from("followups")
          .select("id", { count: "exact", head: true })
          .eq("date", today)
          .eq("completed", false),
        supabase
          .from("followups")
          .select("id", { count: "exact", head: true })
          .lt("date", today)
          .eq("completed", false),
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("status", "admission_confirmed")
          .gte("created_at", today)
      ]);

      setCounts({
        todaysLeads: todaysLeads ?? 0,
        unassigned: unassigned ?? 0,
        followupsToday: followupsToday ?? 0,
        missedFollowups: missedFollowups ?? 0,
        admissionsToday: admissionsToday ?? 0
      });
    };
    load();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Today</Text>
      <View style={styles.grid}>
        <StatCard
          label="New Leads"
          value={counts?.todaysLeads}
          onPress={() =>
            navigation.navigate("Leads", { statusFilter: "all", createdToday: true })
          }
        />
        <StatCard
          label="Unassigned"
          value={counts?.unassigned}
          onPress={() =>
            navigation.navigate("Leads", { unassignedOnly: true })
          }
        />
        <StatCard
          label="Followups Today"
          value={counts?.followupsToday}
          onPress={() => navigation.navigate("Followups", { mode: "today" })}
        />
        <StatCard
          label="Missed Followups"
          value={counts?.missedFollowups}
          warn
          onPress={() => navigation.navigate("Followups", { mode: "missed" })}
        />
        <StatCard
          label="Admissions Today"
          value={counts?.admissionsToday}
          onPress={() =>
            navigation.navigate("Leads", {
              statusFilter: "admission_confirmed",
              createdToday: true
            })
          }
        />
      </View>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  warn,
  onPress
}: {
  label: string;
  value?: number;
  warn?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.card, warn && value ? styles.cardWarn : undefined]}
      onPress={onPress}
    >
      <Text style={styles.cardValue}>{value ?? "–"}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  heading: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  cardWarn: { borderColor: "#DC2626", backgroundColor: "#FEF2F2" },
  cardValue: { fontSize: 26, fontWeight: "800", color: "#0F172A" },
  cardLabel: { fontSize: 12, color: "#64748B", marginTop: 4 }
});
