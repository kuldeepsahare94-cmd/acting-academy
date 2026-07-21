import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { supabase } from "@/services/supabase";
import { Lead } from "@/types";
import { useCallHandler } from "@/hooks/useCallHandler";
import CallOutcomeModal from "@/components/CallOutcomeModal";

type TimelineItem = {
  id: string;
  kind: "call" | "followup" | "status_change" | "payment";
  label: string;
  detail: string;
  timestamp: string;
};

export default function LeadDetailScreen() {
  const route = useRoute<any>();
  const { leadId } = route.params;

  const [lead, setLead] = useState<Lead | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { pendingCall, showOutcomeModal, startCall, closeOutcomeModal } =
    useCallHandler();

  const loadLead = useCallback(async () => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();
    if (data) setLead(data as Lead);
  }, [leadId]);

  const loadTimeline = useCallback(async () => {
    // Calls and followups both feed the same visual timeline. In production
    // this could be one Postgres view (e.g. `lead_timeline`) instead of two
    // client-side queries merged together.
    const [{ data: calls }, { data: followups }] = await Promise.all([
      supabase
        .from("call_logs")
        .select("*")
        .eq("lead_id", leadId)
        .order("start_time", { ascending: false }),
      supabase
        .from("followups")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
    ]);

    const items: TimelineItem[] = [
      ...(calls ?? []).map((c: any) => ({
        id: `call-${c.id}`,
        kind: "call" as const,
        label: `Call · ${c.outcome.replace(/_/g, " ")}`,
        detail: c.notes || "No notes",
        timestamp: c.start_time
      })),
      ...(followups ?? []).map((f: any) => ({
        id: `followup-${f.id}`,
        kind: "followup" as const,
        label: `Followup scheduled (${f.type})`,
        detail: `${f.date} ${f.time}`,
        timestamp: f.created_at
      }))
    ].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

    setTimeline(items);
  }, [leadId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
    loadLead();
    loadTimeline();
  }, [loadLead, loadTimeline]);

  const handleCallPress = async () => {
    if (!lead) return;
    try {
      await startCall(lead.id, lead.mobile);
    } catch (err: any) {
      Alert.alert("Can't place call", err.message);
    }
  };

  const handleWhatsApp = () => {
    if (!lead) return;
    const digits = lead.mobile.replace(/[^\d]/g, "");
    Linking.openURL(`https://wa.me/${digits}`);
  };

  const handleSms = () => {
    if (!lead) return;
    Linking.openURL(`sms:${lead.mobile}`);
  };

  const handleEmail = () => {
    if (!lead?.email) {
      Alert.alert("No email on file", "Add an email address to this lead first.");
      return;
    }
    const subject = encodeURIComponent(
      `Regarding your enquiry${lead.course_interested ? ` — ${lead.course_interested}` : ""}`
    );
    Linking.openURL(`mailto:${lead.email}?subject=${subject}`);
  };

  const handleMaps = () => {
    if (!lead?.city) return;
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        lead.city
      )}`
    );
  };

  if (!lead) {
    return (
      <View style={styles.center}>
        <Text>Loading lead...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{lead.name}</Text>
        <Text style={styles.meta}>{lead.mobile}</Text>
        <Text style={styles.meta}>
          {lead.course_interested ?? "No course"} · {lead.city ?? "No city"}
        </Text>
        <Text style={styles.status}>{lead.status.replace(/_/g, " ")}</Text>
      </View>

      <View style={styles.actionsRow}>
        <ActionButton icon="call" label="Call" onPress={handleCallPress} />
        <ActionButton icon="logo-whatsapp" label="WhatsApp" onPress={handleWhatsApp} />
        <ActionButton icon="chatbubble-ellipses" label="SMS" onPress={handleSms} />
        <ActionButton icon="mail" label="Email" onPress={handleEmail} disabled={!lead.email} />
        <ActionButton icon="location" label="Maps" onPress={handleMaps} disabled={!lead.city} />
      </View>

      <Text style={styles.sectionTitle}>Activity Timeline</Text>
      {timeline.length === 0 && (
        <Text style={styles.empty}>No activity yet. Make the first call.</Text>
      )}
      {timeline.map((item) => (
        <View key={item.id} style={styles.timelineItem}>
          <Text style={styles.timelineLabel}>{item.label}</Text>
          <Text style={styles.timelineDetail}>{item.detail}</Text>
          <Text style={styles.timelineTime}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      ))}

      <CallOutcomeModal
        visible={showOutcomeModal}
        call={pendingCall}
        currentUserId={currentUserId ?? ""}
        onClose={closeOutcomeModal}
        onSaved={() => {
          closeOutcomeModal();
          loadLead();
          loadTimeline();
        }}
      />
    </ScrollView>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  disabled
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={20} color={disabled ? "#94A3B8" : "#fff"} />
      <Text
        style={[styles.actionButtonText, disabled && styles.actionButtonTextDisabled]}
      >
        {label}
      </Text>
    </Pressable>
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
  status: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    textTransform: "uppercase"
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
    gap: 8
  },
  actionButton: {
    flexBasis: "31%",
    flexGrow: 1,
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    gap: 4
  },
  actionButtonDisabled: { backgroundColor: "#E2E8F0" },
  actionButtonText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  actionButtonTextDisabled: { color: "#94A3B8" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginTop: 22, marginBottom: 8 },
  empty: { color: "#94A3B8" },
  timelineItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#0F172A"
  },
  timelineLabel: { fontWeight: "700", fontSize: 13, color: "#0F172A" },
  timelineDetail: { fontSize: 12, color: "#475569", marginTop: 2 },
  timelineTime: { fontSize: 11, color: "#94A3B8", marginTop: 4 }
});
