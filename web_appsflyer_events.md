# Web Template — AppsFlyer Event Handlers

## Konsept

Web template ichida kerakli joylarda JavaScript orqali Flutter'ga message yuboriladi.
Flutter tomonda `JavaScriptChannel` yoki `flutter_inappwebview` handler orqali message qabul qilinadi va `appsflyer_sdk.logEvent()` chaqiriladi.

## Bridge funksiya

Har bir web sahifada global bridge funksiya mavjud bo'lishi kerak. Buni bitta `<script>` teg ichida yoki common JS faylda joylashtiring:

```javascript
function sendAppEvent(eventName, eventData) {
  // flutter_inappwebview uchun
  if (window.flutter_inappwebview) {
    window.flutter_inappwebview.callHandler('onAppsflyerEvent', JSON.stringify({
      event: eventName,
      data: eventData || {}
    }));
    return;
  }

  // webview_flutter (JavaScriptChannel) uchun
  if (window.AppsflyerChannel) {
    AppsflyerChannel.postMessage(JSON.stringify({
      event: eventName,
      data: eventData || {}
    }));
    return;
  }
}
```

## Eventlarni qo'yish joylari

### 1. Login sahifasi ochilganda — `af_page_reg_entry`

Login page load bo'lganda bir marta chaqiriladi.

```html
<!-- login.html yoki login page component -->
<script>
  document.addEventListener('DOMContentLoaded', function () {
    sendAppEvent('af_page_reg_entry');
  });
</script>
```

Agar SPA (Vue/React) bo'lsa — `onMounted` / `useEffect` ichida:

```javascript
// Vue 3
onMounted(() => {
  sendAppEvent('af_page_reg_entry');
});

// React
useEffect(() => {
  sendAppEvent('af_page_reg_entry');
}, []);
```

### 2. Muvaffaqiyatli login — `af_login`

Backend'dan muvaffaqiyatli response qaytgandan keyin, login handler ichida:

```javascript
async function handleLogin(phone, code) {
  const response = await fetch('/api/auth/login', { ... });
  const result = await response.json();

  if (result.success) {
    // user_id ni ham yuborish — Flutter da setCustomerUserId uchun
    sendAppEvent('af_login', { user_id: result.user_id });
  }
}
```

### 3. Verifikatsiya sahifasi ochilganda — `af_page_verification`

Verifikatsiya page/step ko'rsatilganda:

```javascript
// Verifikatsiya sahifasi ochilganda
sendAppEvent('af_page_verification');
```

### 4. Muvaffaqiyatli verifikatsiya — `af_verification_success`

Backend verifikatsiyani tasdiqlagan response'dan keyin:

```javascript
async function handleVerification(data) {
  const response = await fetch('/api/verification/submit', { ... });
  const result = await response.json();

  if (result.verified) {
    sendAppEvent('af_verification_success');
  }
}
```

## Muhim qoidalar

- Har bir event **faqat 1 marta** yuboriladi (page reload, re-render da takror yuborilmasin).
  `af_page_*` eventlar uchun flag ishlatish tavsiya etiladi:

```javascript
let pageRegEntrySent = false;

function onLoginPageVisible() {
  if (pageRegEntrySent) return;
  pageRegEntrySent = true;
  sendAppEvent('af_page_reg_entry');
}
```

- `af_login` eventda `user_id` yuborish shart — Flutter tomonda `setCustomerUserId` chaqirish uchun.
- Event yuborishdan oldin AppsFlyer SDK init bo'lganligini tekshirish shart emas — bu Flutter tomonda boshqariladi (SDK init bo'lmaguncha eventlar queue'da turadi).
