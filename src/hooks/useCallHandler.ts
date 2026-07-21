import { useCallback, useRef, useState } from "react";
import { AppState, AppStateStatus, Linking, Platform } from "react-native";

export interface PendingCall {
  leadId: string;
  mobile: string;
  startTime: Date;
}

/**
 * Handles the "tap to call" -> native dialer -> return to app -> log outcome
 * flow described in the spec:
 *   1. User taps Call on a lead.
 *   2. Linking opens the native Android dialer with tel:<number>.
 *   3. We record start time and start listening to AppState.
 *   4. When the app comes back to "active" (user hung up / returned),
 *      we compute duration and open the Call Outcome modal.
 *
 * Note: Android does not give third-party apps a reliable "call ended" event
 * without a native module + CALL_LOG/READ_PHONE_STATE permissions and a
 * custom native module (Linking alone can't detect call end). This hook uses
 * the AppState transition as a solid approximation, which is the standard
 * approach for Expo-managed apps. If you need exact telecom-level call
 * events, eject to a bare workflow and add a native BroadcastReceiver on
 * android.intent.action.PHONE_STATE.
 */
export function useCallHandler() {
  const [pendingCall, setPendingCall] = useState<PendingCall | null>(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const appState = useRef(AppState.currentState);
  const listenerAttached = useRef(false);

  const attachReturnListener = useCallback((call: PendingCall) => {
    if (listenerAttached.current) return;
    listenerAttached.current = true;

    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const wasBackground =
          appState.current.match(/inactive|background/) !== null;
        if (wasBackground && nextState === "active") {
          // User has returned from the dialer.
          setShowOutcomeModal(true);
          subscription.remove();
          listenerAttached.current = false;
        }
        appState.current = nextState;
      }
    );
  }, []);

  const startCall = useCallback(
    async (leadId: string, mobile: string) => {
      const telUrl = Platform.select({
        android: `tel:${mobile}`,
        ios: `telprompt:${mobile}`,
        default: `tel:${mobile}`
      }) as string;

      const canOpen = await Linking.canOpenURL(telUrl);
      if (!canOpen) {
        throw new Error("This device cannot place calls.");
      }

      const call: PendingCall = { leadId, mobile, startTime: new Date() };
      setPendingCall(call);
      attachReturnListener(call);
      await Linking.openURL(telUrl);
    },
    [attachReturnListener]
  );

  const closeOutcomeModal = useCallback(() => {
    setShowOutcomeModal(false);
    setPendingCall(null);
  }, []);

  return {
    pendingCall,
    showOutcomeModal,
    startCall,
    closeOutcomeModal
  };
}
