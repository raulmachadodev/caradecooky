// Hook: usePushNotifications
// Manages service worker registration, push subscription, and Supabase persistence

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = "BGOuWCYGXYjqoSJNQ9r8k4W29TzhXCHZmrvZ2iOud2dSO-r2HUS6_d2AUlUwe7c5Ql3cOlhOycLcaQqRQATy3FA";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushStatus = "unsupported" | "denied" | "granted" | "default" | "loading";

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check current state on mount
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission as PushStatus);
    checkSubscription();
  }, []);

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch (_) {
      setIsSubscribed(false);
    }
  }

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Notificações push não são suportadas neste dispositivo.");
      return;
    }

    try {
      setStatus("loading");

      // Register service worker
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();
      setStatus(permission as PushStatus);

      if (permission !== "granted") {
        if (permission === "denied") {
          toast.error("Permissão negada.", {
            description: "Para ativar, vá em Configurações > Safari > Notificações.",
          });
        }
        return;
      }

      // Subscribe to push
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = subscription.toJSON();
      const keys = subJson.keys as { p256dh: string; auth: string };

      // Save subscription to Supabase
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        { onConflict: "endpoint" }
      );

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("🔔 Notificações ativadas!", {
        description: "Você receberá alertas de novos pedidos mesmo com a tela fechada.",
      });
    } catch (err: any) {
      console.error("Push subscription error:", err);
      setStatus(Notification.permission as PushStatus);

      // iOS-specific guidance
      if (err.message?.includes("not allowed") || err.name === "NotAllowedError") {
        toast.error("Permissão bloqueada pelo iOS.", {
          description:
            "Certifique-se de que o site foi adicionado à tela inicial (Add to Home Screen) e tente novamente.",
          duration: 8000,
        });
      } else {
        toast.error("Erro ao ativar notificações.", { description: err.message });
      }
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      toast.success("🔕 Notificações desativadas.");
    } catch (err: any) {
      toast.error("Erro ao desativar notificações.", { description: err.message });
    }
  }, []);

  return { status, isSubscribed, subscribe, unsubscribe };
}
