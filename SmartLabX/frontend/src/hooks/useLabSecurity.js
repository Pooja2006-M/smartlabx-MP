import { useEffect, useRef, useCallback } from "react";
import { logSecurityEvent as broadcastSecurityEvent, subscribeToStaffWarnings } from "../utils/liveTracker";

/**
 * useLabSecurity — SmartLabX Safe Lab Mode
 * Blocks: copy, paste, cut, right-click, F12, Ctrl+U, Ctrl+Shift+I/J/C
 * Detects: tab switch (visibilitychange)
 * Auto-logout after `maxViolations` (default: 3)
 */
export default function useLabSecurity({
  enabled = false,
  studentEmail = '',
  onViolation = () => {},
  onAutoLogout = () => {},
  maxViolations = 10,
} = {}) {
  const violationCount = useRef(0);

  const logSecurityEvent = useCallback((type, message) => {
    try {
      broadcastSecurityEvent({ email: studentEmail, type, message });
    } catch (e) {
      console.error(e);
    }
  }, [studentEmail]);

  const recordViolation = useCallback(
    (type) => {
      violationCount.current += 1;
      logSecurityEvent(type, `Violation #${violationCount.current}: ${type}`);
      onViolation({ type, count: violationCount.current, max: maxViolations });
      if (violationCount.current >= maxViolations) {
        logSecurityEvent('AUTO_LOGOUT', `Auto-logged out after ${maxViolations} violations.`);
        onAutoLogout();
      }
    },
    [maxViolations, onViolation, onAutoLogout, logSecurityEvent]
  );

  useEffect(() => {
    if (!enabled) return;

    // Log session entry
    logSecurityEvent('EXPERIMENT_ENTER', 'Entered Safe Exam Mode (Experiment started)');

    // Request Fullscreen Mode when entering experiment
    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (err) {
        console.warn("Fullscreen request failed", err);
      }
    };
    enterFullscreen();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logSecurityEvent('FULLSCREEN_EXIT', 'Exited Fullscreen Mode (Warning recorded)');
        alert("[!] Fullscreen was exited. This counts as a security violation.");
        recordViolation('fullscreen-exit');
      }
    };

    const blockCopy = (e) => { e.preventDefault(); e.stopPropagation(); recordViolation("copy"); return false; };
    const blockPaste = (e) => { e.preventDefault(); e.stopPropagation(); recordViolation("paste"); return false; };
    const blockContextMenu = (e) => { e.preventDefault(); e.stopPropagation(); recordViolation("right-click"); return false; };

    const blockKeyboard = (e) => {
      const key = e.key ? e.key.toLowerCase() : "";
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      if (key === "f12") { e.preventDefault(); recordViolation("devtools-f12"); return false; }
      if (ctrl && shift && ["i", "j", "c"].includes(key)) { e.preventDefault(); recordViolation("devtools-shortcut"); return false; }
      if (ctrl && key === "u") { e.preventDefault(); recordViolation("view-source"); return false; }
      if (ctrl && !shift && key === "c") { e.preventDefault(); recordViolation("copy"); return false; }
      if (ctrl && !shift && key === "v") { e.preventDefault(); recordViolation("paste"); return false; }
      if (ctrl && !shift && key === "x") { e.preventDefault(); recordViolation("cut"); return false; }
      if (ctrl && !shift && key === "a") { e.preventDefault(); recordViolation("prevent-all"); return false; }
      if (ctrl && key === "p") { e.preventDefault(); recordViolation("print"); return false; }
      if (key === "escape") { e.preventDefault(); recordViolation("escape-key"); return false; }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSecurityEvent('TAB_SWITCH_EXIT', 'Left tab / window (Warning recorded)');
        alert("[!] Tab switch detected. Stay in the exam tab.");
        recordViolation('tab-switch');
      }
    };

    const blockDrag = (e) => {
      // Safe Exam Mode must still allow the experiment's device library drag-and-drop.
      if (e.target?.closest?.('[draggable="true"]')) return true;
      e.preventDefault();
      return false;
    };

    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    document.addEventListener("copy", blockCopy, true);
    document.addEventListener("cut", blockCopy, true);
    document.addEventListener("paste", blockPaste, true);
    document.addEventListener("contextmenu", blockContextMenu, true);
    document.addEventListener("keydown", blockKeyboard, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("dragstart", blockDrag, true);

    // Listen for incoming Staff Warnings via BroadcastChannel & Socket
    const unsubscribeWarning = subscribeToStaffWarnings((warningData) => {
      alert(`[!] FACULTY WARNING RECEIVED [!]\n\nInstructor ${warningData.sender || 'Staff'} says:\n"${warningData.message}"\n\nPlease adhere to lab guidelines!`);
    });

    return () => {
      unsubscribeWarning();
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      document.removeEventListener("copy", blockCopy, true);
      document.removeEventListener("cut", blockCopy, true);
      document.removeEventListener("paste", blockPaste, true);
      document.removeEventListener("contextmenu", blockContextMenu, true);
      document.removeEventListener("keydown", blockKeyboard, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("dragstart", blockDrag, true);
      
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      violationCount.current = 0;
    };
  }, [enabled, recordViolation, onAutoLogout, logSecurityEvent]);

  return { violationCount };
}
