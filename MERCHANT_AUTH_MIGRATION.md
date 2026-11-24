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

## Implemented locally (not deployed): firestore.rules.next, merchant-auth.js, tests/rules/*
Design chosen: Firebase Auth email/password with a synthetic email (cannot receive mail, so no email reset; Firebase's
standard reset needs a real mailbox). Recovery = admin issues a new one-time activation code. Activation doc id is the
128-bit secret, no list access, claim is one batched write that consumes the code and sets ownerUid together (rules use get/getAfter).
Run tests: firebase emulators:exec --only firestore "node tests/rules/merchant-claim.rules.test.js" (copy firestore.rules.next to firestore.rules for the test project).
Remaining before go-live: client wiring behind KT_CONFIG.SECURE_MERCHANT_AUTH (merchant.html/admin.html), Auth emulator test of merchant-auth.js register/login/claim,
admin deletes legacy password fields, rules deployed, public merchant docs checked to contain no secrets (legacy docs still hold the password field until deleted: rules cannot hide a field).

## Fail-closed public reads (final design)
`merchants/{id}` is private (owner/admin only). The storefront reads `merchantsPublic/{id}`, an explicit whitelist projection
(rules reject password/ownerUid/any non-listed key; only approved merchants; written by admin or by the approved merchant's owner).
Legacy password docs are therefore unreadable publicly even before cleanup. Rules cannot filter a query by field absence, which is why
a projection collection is used instead of `!('password' in resource.data)`.
Client sites that must change before activation (not changed yet): app.js ktSyncFromFirebase/listenMerchants -> merchantsPublic;
admin.html merchants list stays on merchants (admin); merchant.html login/register/updates -> merchant-auth.js; every merchant product edit
must also write merchantsPublic in one batch; admin one-time job copies whitelisted fields of approved merchants to merchantsPublic.
Known unrelated conflict: firebase-helpers.js placeOrder runs a customer-side transaction that reads merchant products and updates stock on merchants/{id};
neither the old rules nor these allow a customer to write a merchant doc, and with private merchants the read fails too. Order placement needs a server function
(Blaze) or a redesign; not changed.
Tests: tests/rules/merchant-claim.rules.test.js (24), merchant-failclosed.rules.test.js (17), merchant-auth.emulator.test.js (4, Auth+Firestore emulators).

## Checkout (found in review)
- app.js calls `KT_FB.saveOrder`, which is not defined anywhere, so Firestore orders are never written today; orders live in localStorage plus the WhatsApp message. `fbPlaceOrder` (firebase-helpers.js) exists but is never called.
- `fbPlaceOrder` would be DENIED under current repo rules (customer transaction mutates merchants/{id}.products) and under rules.next. Tested in tests/rules/checkout.rules.test.js.
- Free-compatible route (tested at rules level): customer creates a pending order request (status 'placed', no stock mutation); merchant owner/admin accepts with one batch (order -> confirmed + stock decrement). Known limit: rules cannot price-check item arrays, so the accept step must verify totals against the catalog. Oversell is prevented at accept time, not at request time.
- Not wired into app.js yet.

## Order flow v2 (order-flow.js, flag KT_CONFIG.SECURE_ORDERS, default OFF)
- Customer: `KT_FB.requestOrder` writes a pending order (status 'placed' + `itemQty` map). Stock untouched. Failure shows a visible error; the WhatsApp message still opens, and the toast says the order is NOT yet confirmed.
- Merchant: "تأكيد الطلب" calls `KT_FB.acceptOrder` = one client transaction: re-read order, trusted catalog (merchants/{id}.products), per-item stock docs (merchants/{id}/stock/{pid}); recompute total (delivery rule + coupon), write order->confirmed (+confirmedTotal, totalCorrected) and exact stock decrements. A forged customer total is corrected visibly (toast + totalCorrected flag).
- Rules: owner stock decrease only with lastOrderId link: order was 'placed' (get) and becomes 'confirmed' (getAfter) in the same write, merchant matches, decrement == order.itemQty[pid]. Restock (increase) allowed to owner; arbitrary decrease denied. Order status transitions constrained.
- Concurrency tested with real client transactions on the emulator (2 competing for 1 unit, 5 competing for 3 units): exact winners, stock never negative. A lost race can surface as permission-denied (rules see newer stock) so acceptOrder retries.
- Needed before enabling: create stock docs for each merchant product (admin job), deploy rules.next, wire merchants' product list to the same ids. Not tested against real Firebase (no project access).
- Limits of the no-functions design: customers can submit a forged total/prices (rules cannot loop over item arrays); correction happens at accept. Multi-merchant carts are rejected with a visible message. Online-payment (InstaPay/Vodafone) path is not wired to Firestore (it was never saved before either).
