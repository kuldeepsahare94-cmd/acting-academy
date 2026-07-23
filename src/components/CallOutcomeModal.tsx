import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert
} from "react-native";
import { supabase } from "@/services/supabase";
import { CallOutcome } from "@/types";
import { PendingCall } from "@/hooks/useCallHandler";
import { DateField, TimeField, formatDate, formatTime } from "@/components/DateTimeFields";

interface Props {
  visible: boolean;
  call: PendingCall | null;
  currentUserId: string;
  onClose: () => void;
  onSaved: () => void;
}

const OUTCOMES: { value: CallOutcome; label: string }[] = [
  { value: "connected_interested", label: "Connected – Interested" },
  { value: "connected_not_interested", label: "Connected – Not Interested" },
  { value: "no_answer", label: "No Answer" },
  { value: "switched_off", label: "Switched Off" },
  { value: "wrong_number", label: "Wrong Number" },
  { value: "call_back_later", label: "Call Back Later" }
];

export default function CallOutcomeModal({
  visible,
  call,
  currentUserId,
  onClose,
  onSaved
}: Props) {
  const [outcome, setOutcome] = useState<CallOutcome>("connected_interested");
  const [notes, setNotes] = useState("");
  const [followupDate, setFollowupDate] = useState<Date | null>(null);
  const [followupTime, setFollowupTime] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setOutcome("connected_interested");
    setNotes("");
    setFollowupDate(null);
    setFollowupTime(null);
  };

  const handleSave = async () => {
    if (!call) return;
    setSaving(true);
    try {
      const endTime = new Date();
      const durationSeconds = Math.max(
        0,
        Math.round((endTime.getTime() - call.startTime.getTime()) / 1000)
      );

      const dateStr = followupDate ? formatDate(followupDate) : null;
      const timeStr = followupTime ? formatTime(followupTime) : null;

      let followupId: string | null = null;

      // If a followup was set, create it first so we can link it to the call log.
      if (dateStr && timeStr) {
        const { data: followup, error: followupError } = await supabase
          .from("followups")
          .insert({
            lead_id: call.leadId,
            user_id: currentUserId,
            date: dateStr,
            time: timeStr,
            type: "call",
            priority: "medium",
            notes
          })
          .select("id")
          .single();

        if (followupError) throw followupError;
        followupId = followup.id;
      }

      const { error: callLogError } = await supabase.from("call_logs").insert({
        lead_id: call.leadId,
        user_id: currentUserId,
        start_time: call.startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_seconds: durationSeconds,
        notes,
        outcome,
        created_followup_id: followupId
      });

      if (callLogError) throw callLogError;

      // Keep the lead record's followup pointers current for dashboard counts.
      await supabase
        .from("leads")
        .update({
          last_followup_at: endTime.toISOString(),
          next_followup_at: dateStr && timeStr ? `${dateStr}T${timeStr}:00` : null
        })
        .eq("id", call.leadId);

      reset();
      onSaved();
    } catch (err: any) {
      Alert.alert("Couldn't save call log", err.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView>
            <Text style={styles.title}>How did the call go?</Text>

            <Text style={styles.label}>Call Status</Text>
            <View style={styles.outcomeGrid}>
              {OUTCOMES.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => setOutcome(o.value)}
                  style={[
                    styles.outcomeChip,
                    outcome === o.value && styles.outcomeChipActive
                  ]}
                >
                  <Text
                    style={[
                      styles.outcomeChipText,
                      outcome === o.value && styles.outcomeChipTextActive
                    ]}
                  >
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Conversation Notes</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="What was discussed..."
              value={notes}
              onChangeText={setNotes}
            />

            <Text style={styles.label}>Next Followup (optional)</Text>
            <View style={styles.row}>
              <DateField label="Date" value={followupDate} onChange={setFollowupDate} minimumDate={new Date()} />
              <View style={{ width: 8 }} />
              <TimeField label="Time" value={followupTime} onChange={setFollowupTime} />
            </View>

            <Pressable
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? "Saving..." : "Save Call Log"}
              </Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%"
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#0F172A" },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginTop: 14, marginBottom: 6 },
  outcomeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  outcomeChip: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8
  },
  outcomeChipActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  outcomeChipText: { fontSize: 12, color: "#334155" },
  outcomeChipTextActive: { color: "#fff" },
  textArea: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 10,
    textAlignVertical: "top",
    minHeight: 90
  },
  row: { flexDirection: "row" },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 10
  },
  saveButton: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20
  },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelButton: { alignItems: "center", paddingVertical: 12 },
  cancelButtonText: { color: "#64748B", fontSize: 14 }
});
