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

## Revision after emulator results and security review

Emulator test (tests/rules/merchants.rules.test.js, repo firestore.rules, fake data, Firestore emulator 1.19.8):
- anon unfiltered merchants list: DENIED (this was the console error). anon approved-only list: allowed, and the doc includes the password field.
- anon phone lookup (merchant.html login query) is DENIED even for an approved merchant, because the query is not constrained to status=='approved'.
- anon create approved merchant: denied; anon create pending: allowed; owner update only if ownerUid matches. Merchants created with ownerUid null can never update their own doc under these rules.
=> If these rules are what is deployed, merchant login and dashboard writes already fail today. Deployed rules are unverified.

Recovery design (no email, no trust in phone alone, no client-only approval):
1. Admin (rules: isAdmin) creates `merchantActivations/{random 128-bit id}` = {merchantId, expiresAt}. Rules: create/delete admin only; `get` allowed by id; `list` denied.
2. Admin gives that code to the merchant out of band (WhatsApp/in person).
3. Merchant opens activation link, creates a Firebase Auth user (email/password, synthetic email, password chosen by merchant), then updates merchants/{id}.ownerUid = auth.uid.
   Rule allows that update only when resource.ownerUid == null, only ownerUid changes, exists(activation doc) with matching merchantId and not expired. Then the activation doc is deleted by the client (rule: owner may delete the doc for its merchant) or expires.
4. Password reset later: admin issues a new activation code (rule-enforced admin action), which re-links ownerUid after admin clears it. Synthetic emails never receive mail, so no email reset.
5. Plaintext `password` fields: admin deletes them after activation, and the rules must stop exposing them: either delete the field or restrict approved-merchant public read to a separate `merchantsPublic` collection (name, address, hours, products). Public read of the full merchants doc should be removed.
Rollback: restore the exported merchants minus the password field, keep Auth users. Never restore plaintext passwords or the old public-read rule.
Not yet implemented: the code and rule changes above (need tests on the emulator first); nothing is live.
