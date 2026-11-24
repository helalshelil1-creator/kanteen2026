# Merchant login migration plan (kanteen2026)

Problem (from code, not confirmed on the deployed project): merchant password is stored as plaintext in
`merchants/{id}.password` (merchant.html register, admin.html add-merchant) and merchant.html compares it in the browser.
firestore.rules lets anyone read merchants with status == 'approved'.

Target: Firebase Auth email/password. Email = `<normalized phone digits>@merchants.kanteen.invalid` (no real mail needed),
`merchants/{id}.ownerUid` = auth uid (rules already use ownerUid for read/update).

Prerequisites (need owner access to Firebase project kanteen2026, NOT available to the agent yet)
1. Console: Authentication > Sign-in method > enable Email/Password.
2. Read-only export of merchants (backup) BEFORE any change. Keep it off-repo.
3. Deploy rules from this repo only after step 4 code is live (rules already compatible; also add a rule or move password out).

Code changes (not yet written/activated; keep behind KT_CONFIG.SECURE_MERCHANT_AUTH, default false)
- merchant.html register: createUserWithEmailAndPassword, store ownerUid, do NOT store password.
- merchant.html login: signInWithEmailAndPassword; on success find merchant by ownerUid.
- admin.html add-merchant: admin creates the merchant doc with ownerUid null + a one-time activation (merchant sets own password on first login).

Existing merchants (reset on activation, as approved)
- Their old password is NOT trusted or copied. Each merchant's first login after activation goes through "set a new password":
  verify phone ownership is not possible without SMS backend, so the ADMIN must approve the activation (admin sets `activationApproved:true`
  on that merchant) and then the merchant picks a new password, creating the Auth user and setting ownerUid.
- After all merchants are activated (or at an agreed date): admin script deletes the `password` field from merchant docs.
  Until then the plaintext field remains exposed, so deletion is the actual mitigation, not hiding it in the UI.

Rollback: keep the flag off + restore exported merchants + previous rules. Old login stays available until the flag is on.
Verification before go-live: Firebase Auth emulator or a throwaway test project: register, login, wrong password, admin approve, rules read/update as owner vs stranger.
Merchant impact: every existing merchant must set a new password once; admin approves each activation.
