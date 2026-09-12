export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick?: (e?: React.MouseEvent) => void;
  variant?: "solid" | "glass";
}

export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
  action?: ToastAction;
  dismissible: boolean;
  createdAt: number;
}

type ToastSubscriber = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const subscribers = new Set<ToastSubscriber>();

function notify() {
  subscribers.forEach((subscriber) => subscriber([...toasts]));
}

export function subscribeToasts(subscriber: ToastSubscriber): () => void {
  subscribers.add(subscriber);
  subscriber([...toasts]);
  return () => {
    subscribers.delete(subscriber);
  };
}

export function getToasts(): ToastItem[] {
  return [...toasts];
}

function createToast(type: ToastType, title: string, options?: ToastOptions): string {
  const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const duration = options?.duration ?? 4500;
  const dismissible = options?.dismissible ?? false;

  const newToast: ToastItem = {
    id,
    type,
    title,
    description: options?.description,
    duration,
    action: options?.action,
    dismissible,
    createdAt: Date.now(),
  };

  // Keep up to 5 toasts visible simultaneously
  toasts = [newToast, ...toasts].slice(0, 5);
  notify();

  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
}

export function dismissToast(id?: string) {
  if (id) {
    toasts = toasts.filter((t) => t.id !== id);
  } else {
    toasts = [];
  }
  notify();
}

export const toast = {
  success: (title: string, options?: ToastOptions) => createToast("success", title, options),
  error: (title: string, options?: ToastOptions) => createToast("error", title, options),
  info: (title: string, options?: ToastOptions) => createToast("info", title, options),
  warning: (title: string, options?: ToastOptions) => createToast("warning", title, options),
  dismiss: (id?: string) => dismissToast(id),
  clear: () => dismissToast(),
};

if (typeof window !== "undefined") {
  (window as any).__samvadToast = toast;
}
