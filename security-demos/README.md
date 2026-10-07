# XSS & CSRF Classroom Demos

This folder contains intentionally vulnerable, **localhost-only educational demos** for explaining XSS and CSRF.

## Demo 1 — XSS

The vulnerable example demonstrates what can happen when untrusted HTML is rendered as HTML instead of text.

Try this harmless payload in the demo:

```html
<img src=x onerror="document.body.dataset.xss='triggered'; alert('XSS demo')">
```

The important lesson is that the browser executes attacker-controlled markup when the application incorrectly treats user input as trusted HTML.

### Fix

Prefer normal React rendering:

```jsx
<p>{comment.text}</p>
```

Avoid using `dangerouslySetInnerHTML` with untrusted input. When HTML is genuinely required, sanitize it with a well-maintained sanitizer and use a defense-in-depth Content Security Policy.

## Demo 2 — CSRF

The CSRF demo models a sensitive state-changing endpoint authenticated by a cookie. A second localhost page submits a forged request while the victim is logged in.

The key lesson is that cookies can be sent automatically by the browser, so authentication alone does not prove that a state-changing request was intentionally initiated by the application UI.

### Fixes

Use a CSRF defense appropriate to the architecture:

- SameSite cookies (`Lax` or `Strict` where compatible)
- Anti-CSRF tokens for cookie-authenticated state-changing requests
- Origin/Referer validation where appropriate
- Do not use GET for state-changing operations

## Safety

These examples are intentionally limited to local development and harmless visual effects. Do not use the payloads or demos against systems you do not own or have explicit permission to test.
