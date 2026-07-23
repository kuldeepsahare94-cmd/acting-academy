import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "@/services/supabase";
import { LeadStatus } from "@/types";
import SelectField from "@/components/SelectField";
import { INDIA_STATES, CITIES_BY_STATE } from "@/constants/indiaStatesCities";

const STATUS_OPTIONS: LeadStatus[] = [
  "new",
  "contacted",
  "interested",
  "not_interested",
  "followup_scheduled",
  "admission_confirmed",
  "lost"
];

const SOURCE_OPTIONS = [
  "Facebook Ads",
  "Instagram Ads",
  "Walk-in",
  "Referral",
  "Website",
  "Google Ads"
];

export default function AddLeadScreen() {
  const navigation = useNavigation<any>();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [source, setSource] = useState("");
  const [courseInterested, setCourseInterested] = useState("");
  const [status, setStatus] = useState<LeadStatus>("new");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !mobile.trim()) {
      Alert.alert("Missing info", "Name and mobile number are required.");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from("leads").insert({
        name: name.trim(),
        mobile: mobile.trim(),
        alternate_mobile: alternateMobile.trim() || null,
        email: email.trim() || null,
        state: state || null,
        city: city || null,
        lead_source: source || null,
        course_interested: courseInterested.trim() || null,
        status,
        remarks: remarks.trim() || null,
        assigned_user_id: userData.user?.id ?? null
      });

      if (error) throw error;

      Alert.alert("Lead added", `${name} has been added.`, [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert("Couldn't save lead", err.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.label}>Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Lead's full name" />

        <Text style={styles.label}>Mobile *</Text>
        <TextInput
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Alternate Mobile</Text>
        <TextInput
          style={styles.input}
          value={alternateMobile}
          onChangeText={setAlternateMobile}
          placeholder="Optional"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Optional"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <SelectField
          label="State"
          placeholder="Select state"
          value={state}
          options={INDIA_STATES}
          onSelect={(v) => {
            setState(v);
            setCity("");
          }}
        />

        <SelectField
          label="City"
          placeholder={state ? "Select city" : "Select a state first"}
          value={city}
          options={state ? CITIES_BY_STATE[state] ?? [] : []}
          disabled={!state}
          disabledHint="Select a state first"
          onSelect={setCity}
        />

        <SelectField
          label="Lead Source"
          placeholder="Select source"
          value={source}
          options={SOURCE_OPTIONS}
          onSelect={setSource}
        />

        <Text style={styles.label}>Course Interested</Text>
        <TextInput
          style={styles.input}
          value={courseInterested}
          onChangeText={setCourseInterested}
          placeholder="e.g. Acting Foundation"
        />

        <Text style={styles.label}>Status</Text>
        <View style={styles.chipWrap}>
          {STATUS_OPTIONS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatus(s)}
              style={[styles.chip, status === s && styles.chipActive]}
            >
              <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
                {s.replace(/_/g, " ")}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Remarks</Text>
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Any notes about this lead..."
          multiline
        />

        <Pressable
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Lead"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff"
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#fff"
  },
  chipActive: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  chipText: { fontSize: 12, color: "#334155" },
  chipTextActive: { color: "#fff" },
  saveButton: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40
  },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 }
});
