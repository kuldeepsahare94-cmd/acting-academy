import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

/**
 * Registers the device for push notifications and stores the Expo push
 * token against the logged-in user's profile row. The backend (Supabase
 * Edge Function or server job) reads that token to send:
 *   - New Lead / Lead Assigned
 *   - Followup Reminder / Missed Followup
 *   - Payment Due
 *   - Workshop Tomorrow
 *   - Admission Done
 *
 * For production-scale delivery, wire this token into Firebase Cloud
 * Messaging (FCM) via Expo's push service, which already proxies to FCM
 * on Android — no separate native FCM SDK integration required unless you
 * eject from the managed workflow.
 */
export async function registerForPushNotificationsAsync(userId: string) {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device.");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission not granted.");
    return;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync();
  const token = tokenResponse.data;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX
    });
  }

  await supabase
    .from("user_profiles")
    .update({ expo_push_token: token })
    .eq("id", userId);

  return token;
}
