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
import { FollowupPriority } from "@/types";

interface Props {
  visible: boolean;
  leadId: string;
  currentUserId: string;
  onClose: () => void;
  onSaved: () => void;
}

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" }
];

const PRIORITY_OPTIONS: { value: FollowupPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" }
];

export default function AddFollowupModal({
  visible,
  leadId,
  currentUserId,
  onClose,
  onSaved
}: Props) {
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [time, setTime] = useState(""); // HH:mm
  const [type, setType] = useState("call");
  const [priority, setPriority] = useState<FollowupPriority>("medium");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setDate("");
    setTime("");
    setType("call");
    setPriority("medium");
    setNotes("");
  };

  const handleSave = async () => {
    if (!date.trim() || !time.trim()) {
      Alert.alert("Missing info", "Date and time are required.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("followups").insert({
        lead_id: leadId,
        user_id: currentUserId,
        date: date.trim(),
        time: time.trim(),
        type,
        priority,
        notes: notes.trim() || null
      });
      if (error) throw error;

      await supabase
        .from("leads")
        .update({ next_followup_at: `${date.trim()}T${time.trim()}:00` })
        .eq("id", leadId);

      reset();
      onSaved();
    } catch (err: any) {
      Alert.alert("Couldn't save followup", err.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView>
            <Text style={styles.title}>Schedule a Followup</Text>

            <Text style={styles.label}>Date & Time</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="HH:mm"
                value={time}
                onChangeText={setTime}
              />
            </View>

            <Text style={styles.label}>Type</Text>
            <View style={styles.chipWrap}>
              {TYPE_OPTIONS.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => setType(t.value)}
                  style={[styles.chip, type === t.value && styles.chipActive]}
                >
                  <Text style={[styles.chipText, type === t.value && styles.chipTextActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.chipWrap}>
              {PRIORITY_OPTIONS.map((p) => (
                <Pressable
                  key={p.value}
                  onPress={() => setPriority(p.value)}
                  style={[styles.chip, priority === p.value && styles.chipActive]}
                >
                  <Text
                    style={[styles.chipText, priority === p.value && styles.chipTextActive]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={3}
              placeholder="What's this followup about..."
              value={notes}
              onChangeText={setNotes}
            />

            <Pressable
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? "Saving..." : "Save Followup"}
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
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%"
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#0F172A" },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginTop: 14, marginBottom: 6 },
  row: { flexDirection: "row" },
  input: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 10, padding: 10 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8
  },
  chipActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  chipText: { fontSize: 12, color: "#334155" },
  chipTextActive: { color: "#fff" },
  textArea: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 10,
    textAlignVertical: "top",
    minHeight: 70
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
