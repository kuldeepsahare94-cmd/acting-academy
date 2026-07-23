import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/services/supabase";

interface Counts {
  todaysLeads: number;
  unassigned: number;
  followupsToday: number;
  missedFollowups: number;
  admissionsToday: number;
  totalStudents: number;
  pendingPayments: number;
  revenueToday: number;
  upcomingWorkshops: number;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("");

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("id", userData.user.id)
        .single();
      setUserName(profile?.full_name?.split(" ")[0] ?? "");
    }

    const [
      { count: todaysLeads },
      { count: unassigned },
      { count: followupsToday },
      { count: missedFollowups },
      { count: admissionsToday },
      { count: totalStudents },
      { count: pendingPayments },
      { data: paymentsToday },
      { count: upcomingWorkshops }
    ] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", today),
      supabase.from("leads").select("id", { count: "exact", head: true }).is("assigned_user_id", null),
      supabase.from("followups").select("id", { count: "exact", head: true }).eq("date", today).eq("completed", false),
      supabase.from("followups").select("id", { count: "exact", head: true }).lt("date", today).eq("completed", false),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "admission_confirmed").gte("created_at", today),
      supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("payments").select("amount").eq("payment_date", today),
      supabase.from("workshops").select("id", { count: "exact", head: true }).gte("date", today)
    ]);

    const revenueToday = (paymentsToday ?? []).reduce(
      (sum: number, p: any) => sum + Number(p.amount ?? 0),
      0
    );

    setCounts({
      todaysLeads: todaysLeads ?? 0,
      unassigned: unassigned ?? 0,
      followupsToday: followupsToday ?? 0,
      missedFollowups: missedFollowups ?? 0,
      admissionsToday: admissionsToday ?? 0,
      totalStudents: totalStudents ?? 0,
      pendingPayments: pendingPayments ?? 0,
      revenueToday,
      upcomingWorkshops: upcomingWorkshops ?? 0
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {greeting()}
          {userName ? `, ${userName}` : ""}
        </Text>
        <Text style={styles.subGreeting}>Here's what's happening today</Text>
      </View>

      <View style={styles.quickActionsRow}>
        <QuickAction
          icon="person-add-outline"
          label="Add Lead"
          onPress={() => navigation.navigate("AddLead")}
        />
        <QuickAction
          icon="people-outline"
          label="View Leads"
          onPress={() => navigation.navigate("Leads")}
        />
        <QuickAction
          icon="calendar-outline"
          label="Followups"
          onPress={() => navigation.navigate("Followups")}
        />
      </View>

      <Text style={styles.sectionLabel}>Leads</Text>
      <View style={styles.grid}>
        <StatCard
          icon="person-add"
          color="#2563EB"
          label="New Leads Today"
          value={counts?.todaysLeads}
          onPress={() => navigation.navigate("Leads", { statusFilter: "all", createdToday: true })}
        />
        <StatCard
          icon="alert-circle"
          color="#D97706"
          label="Unassigned"
          value={counts?.unassigned}
          onPress={() => navigation.navigate("Leads", { unassignedOnly: true })}
        />
        <StatCard
          icon="school"
          color="#16A34A"
          label="Admissions Today"
          value={counts?.admissionsToday}
          onPress={() =>
            navigation.navigate("Leads", { statusFilter: "admission_confirmed", createdToday: true })
          }
        />
      </View>

      <Text style={styles.sectionLabel}>Followups</Text>
      <View style={styles.grid}>
        <StatCard
          icon="time"
          color="#2563EB"
          label="Due Today"
          value={counts?.followupsToday}
          onPress={() => navigation.navigate("Followups", { mode: "today" })}
        />
        <StatCard
          icon="warning"
          color="#DC2626"
          label="Missed"
          value={counts?.missedFollowups}
          warn={!!counts?.missedFollowups}
          onPress={() => navigation.navigate("Followups", { mode: "missed" })}
        />
      </View>

      <Text style={styles.sectionLabel}>Academy</Text>
      <View style={styles.grid}>
        <StatCard icon="people" color="#7C3AED" label="Active Students" value={counts?.totalStudents} />
        <StatCard
          icon="cash"
          color="#DC2626"
          label="Pending Payments"
          value={counts?.pendingPayments}
          warn={!!counts?.pendingPayments}
        />
        <StatCard icon="wallet" color="#16A34A" label="Revenue Today" value={counts?.revenueToday} prefix="₹" />
        <StatCard icon="easel" color="#2563EB" label="Upcoming Workshops" value={counts?.upcomingWorkshops} />
      </View>
    </ScrollView>
  );
}

function QuickAction({
  icon,
  label,
  onPress
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={20} color="#0F172A" />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function StatCard({
  icon,
  color,
  label,
  value,
  warn,
  prefix,
  onPress
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  label: string;
  value?: number;
  warn?: boolean;
  prefix?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.card, warn && styles.cardWarn]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconBadge, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.cardValue}>
        {value === undefined ? "–" : `${prefix ?? ""}${value.toLocaleString("en-IN")}`}
      </Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  greeting: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  subGreeting: { fontSize: 13, color: "#64748B", marginTop: 2 },
  quickActionsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    gap: 10
  },
  quickAction: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },
  quickActionLabel: { fontSize: 11, fontWeight: "600", color: "#334155" },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 16
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  cardWarn: { borderColor: "#DC2626", backgroundColor: "#FEF2F2" },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  cardValue: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  cardLabel: { fontSize: 12, color: "#64748B", marginTop: 2 }
});
