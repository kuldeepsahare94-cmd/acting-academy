import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { supabase } from "@/services/supabase";
import { Student } from "@/types";

interface StudentDetail extends Student {
  courses: { name: string } | null;
}

interface PaymentRow {
  id: string;
  amount: number;
  due_amount: number;
  payment_date: string;
  payment_mode: string | null;
  status: string;
}

interface AttendanceRow {
  id: string;
  attendance: string;
  workshops: { name: string; date: string } | null;
}

export default function StudentDetailScreen() {
  const route = useRoute<any>();
  const { studentId } = route.params;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);

  const load = useCallback(async () => {
    const [{ data: s }, { data: p }, { data: a }] = await Promise.all([
      supabase.from("students").select("*, courses(name)").eq("id", studentId).single(),
      supabase
        .from("payments")
        .select("id, amount, due_amount, payment_date, payment_mode, status")
        .eq("student_id", studentId)
        .order("payment_date", { ascending: false }),
      supabase
        .from("workshop_attendees")
        .select("id, attendance, workshops(name, date)")
        .eq("student_id", studentId)
    ]);
    if (s) setStudent(s as unknown as StudentDetail);
    if (p) setPayments(p as PaymentRow[]);
    if (a) setAttendance(a as unknown as AttendanceRow[]);
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!student) {
    return (
      <View style={styles.center}>
        <Text>Loading student...</Text>
      </View>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalDue = payments.reduce((sum, p) => sum + Number(p.due_amount), 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.meta}>{student.student_code} · {student.mobile}</Text>
        <Text style={styles.meta}>
          {student.courses?.name ?? "No course"} · Batch: {student.batch ?? "—"}
        </Text>
        <Text style={styles.meta}>Admitted: {student.admission_date}</Text>
        {student.parent_name ? (
          <Text style={styles.meta}>
            Parent: {student.parent_name} ({student.parent_mobile})
          </Text>
        ) : null}
        <Text style={[styles.statusBadge]}>{student.status.replace(/_/g, " ")}</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>₹{totalPaid.toLocaleString("en-IN")}</Text>
          <Text style={styles.summaryLabel}>Total Paid</Text>
        </View>
        <View style={[styles.summaryCard, totalDue > 0 && styles.summaryCardWarn]}>
          <Text style={styles.summaryValue}>₹{totalDue.toLocaleString("en-IN")}</Text>
          <Text style={styles.summaryLabel}>Due Amount</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Payment History</Text>
      {payments.length === 0 && <Text style={styles.empty}>No payments recorded yet.</Text>}
      {payments.map((p) => (
        <View key={p.id} style={styles.rowItem}>
          <Text style={styles.rowItemTitle}>
            ₹{Number(p.amount).toLocaleString("en-IN")} · {p.payment_mode ?? "—"}
          </Text>
          <Text style={styles.rowItemMeta}>
            {p.payment_date} · {p.status}
            {Number(p.due_amount) > 0 ? ` · ₹${p.due_amount} due` : ""}
          </Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Workshop Attendance</Text>
      {attendance.length === 0 && (
        <Text style={styles.empty}>Not registered for any workshops yet.</Text>
      )}
      {attendance.map((a) => (
        <View key={a.id} style={styles.rowItem}>
          <Text style={styles.rowItemTitle}>{a.workshops?.name ?? "Workshop"}</Text>
          <Text style={styles.rowItemMeta}>
            {a.workshops?.date} · {a.attendance.replace(/_/g, " ")}
          </Text>
        </View>
      ))}
    </ScrollView>
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
  statusBadge: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    textTransform: "uppercase"
  },
  summaryRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  summaryCardWarn: { borderColor: "#DC2626", backgroundColor: "#FEF2F2" },
  summaryValue: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  summaryLabel: { fontSize: 11, color: "#64748B", marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginTop: 22, marginBottom: 8 },
  empty: { color: "#94A3B8" },
  rowItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  rowItemTitle: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  rowItemMeta: { fontSize: 12, color: "#64748B", marginTop: 2 }
});
