# DPD Polska shipping labels

Generates DPD waybill numbers and A4 PDF shipping labels for UNAS orders,
through DPD Polska's **DPDServices** SOAP web service. This is the label
side of the DPD Polska API; tracking (DPDInfoServices) and pickup points
(MyPudoApi) are separate services and are not wired up here.

## What the DPD credentials are

The login pack DPD Polska issues (`login`, `hasło` = password, `masterFID`,
and one or more `FID`s) is the web-service API credential set. `DPDServices`
is the service used here. `masterFID` plus the chosen sender `FID` identify
the sender account on the waybill. There is no OAuth/token step - every SOAP
call carries `{ login, password, masterFID }`.

## Requirements

- PHP **SOAP extension** (`ext-soap`) enabled on the server
  (cPanel → *Select PHP Version* → *Extensions* → tick `soap`).
- Outbound HTTPS to `dpdservices.dpd.com.pl` (production) or
  `dpdservicesdemo.dpd.com.pl` (sandbox).

## Configuration (`.env`)

See the `# ---- DPD Polska ----` block in `.env.example`. Minimum:

```
DPD_ENV=production
DPD_LOGIN=45823101
DPD_PASSWORD=********
DPD_MASTER_FID=458231
DPD_SENDER_FID=458231
DPD_LABEL_PAGE_FORMAT=A4

DPD_SENDER_COMPANY=...
DPD_SENDER_NAME=...
DPD_SENDER_ADDRESS=...
DPD_SENDER_CITY=...
DPD_SENDER_POSTAL_CODE=...
DPD_SENDER_COUNTRY_CODE=PL
DPD_SENDER_PHONE=...
DPD_SENDER_EMAIL=...
```

Cash-on-delivery is **off** unless `DPD_COD_PAYMENT_METHODS` lists substrings
to match against the UNAS payment-method name (e.g. `utánvét,cod`). Verify COD
currency handling with a dry run before the first live COD shipment.

## First run, in order

Run everything **on the server** (the DPD hosts are usually unreachable from a
dev machine).

1. **Apply the migration** `database/migrations/007_create_dpd_shipments.sql`.
2. **Connectivity check** - creates nothing:
   ```
   php scripts/test_dpd_connection.php
   ```
   It loads the WSDL and writes the real operation signatures to
   `storage/logs/dpd_wsdl_functions.txt`. If your account exposes a
   `generatePackagesNumbers` / `generateSpedLabels` version other than `V4`,
   adjust the operation names in `app/Services/DpdApiService.php`.
3. **Dry run on a real order** - fetches + maps, prints the exact payload,
   sends nothing:
   ```
   php scripts/generate_dpd_label.php <UNAS_ORDER_ID> --dry-run
   ```
   Confirm the receiver name/street/ZIP/city/country look right. If a field is
   blank, the UNAS address tag is spelled differently than expected - extend
   the accepted spellings in `DpdOrderMapper::buildReceiver()`.
4. **Live label**:
   ```
   php scripts/generate_dpd_label.php <UNAS_ORDER_ID>
   ```
   Registers the waybill, saves the PDF under `storage/labels/`, and records the
   shipment in `dpd_shipments`. A second run for the same order is refused unless
   you pass `--force` (which registers a duplicate waybill).

## Everyday use: the web page

Once the app is deployed and DPD is configured, sign in and open
**DPD Labels** in the sidebar (`/dpd`). Type the UNAS order id, click
**Generate label**, and download the PDF - no shell needed. The page also
lists recent labels with a download button and shows failures with their
reason. Tick **Force** only to deliberately register a second waybill for an
order that already has one.

The web button and the CLI script run the exact same flow
(`App\Services\DpdLabelGenerator`).

## Design notes / honest unknowns

- The SOAP request field names (`openUMLFeV3`, `authDataV1`, the
  `generateSpedLabels` output params) follow DPD Polska's DPDServices spec and
  two independent PHP client libraries. They could not be verified against the
  live WSDL from the environment this was written in, so step 2 exists to read
  the authoritative signatures. All request keys are spelled out in one place:
  `DpdApiService::buildPackageNumbersRequest()` / `buildLabelsRequest()`.
- UNAS getOrder address tag names (`Customer/Addresses/Shipping/...`) follow
  UNAS's documented schema but had not been exercised in this codebase before.
  The mapper reads several accepted spellings and **validates** - a missing
  required field raises a clear error rather than printing a blank label.
- The password is never written to `api_logs` or to the SOAP trace dump
  (`storage/logs/dpd_soap_last.xml`, written only on failure).
- One parcel per order, default weight `DPD_DEFAULT_PARCEL_WEIGHT_KG` when the
  order carries none. Multi-parcel splitting is not implemented.
