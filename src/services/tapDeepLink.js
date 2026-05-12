// FILE: src/services/tapDeepLink.js
//
// Handles the TAP hosted-checkout return deep link:
//   swivo://tap-callback?tap_id=...&status=success|failed&orderId=...
//
// The link is fired by the web callback page (app/tap/callback) after TAP
// completes the payment. Subscribing to it lets the app jump straight to the
// relevant order screen without forcing the user to navigate manually.
//
import {Linking} from 'react-native';
import useAppStore from '../store/appStore';

const TAP_CALLBACK_HOST = 'tap-callback';

function parseTapCallback(url) {
  if (!url || typeof url !== 'string') return null;
  if (!url.startsWith('swivo://')) return null;
  try {
    // Lazy parse — RN doesn't have URL globally in older runtimes.
    const [, rest] = url.split('swivo://');
    const [host, query = ''] = rest.split('?');
    if (host !== TAP_CALLBACK_HOST) return null;
    const params = {};
    for (const kv of query.split('&')) {
      if (!kv) continue;
      const [k, v = ''] = kv.split('=');
      params[decodeURIComponent(k)] = decodeURIComponent(v);
    }
    return {
      tapId:   params.tap_id  || null,
      status:  params.status  || 'unknown',
      orderId: params.orderId || null,
    };
  } catch {
    return null;
  }
}

function handleParsed(payload) {
  if (!payload) return;
  const {status, orderId} = payload;
  const requestNav = useAppStore.getState().requestNav;
  // Always land on the orders tab; the specific order id (if any) lets the
  // screen scroll/open it. The status param flows into the store for an
  // in-app toast if the consumer wants one.
  if (orderId) {
    requestNav('orders', orderId);
  } else {
    requestNav('orders');
  }
  useAppStore.setState({lastTapCallback: {...payload, receivedAt: Date.now()}});
}

// Subscribe — call once at app startup. Returns an unsubscribe function.
export function subscribeToTapDeepLink() {
  // 1) cold-start: the app was launched directly from the deep link.
  Linking.getInitialURL().then(url => handleParsed(parseTapCallback(url))).catch(() => {});

  // 2) warm: the app was already open when the link fired.
  const sub = Linking.addEventListener('url', ({url}) => {
    handleParsed(parseTapCallback(url));
  });
  return () => sub.remove();
}
