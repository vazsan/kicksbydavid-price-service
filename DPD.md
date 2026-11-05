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

## Price list used by the profit dashboard (cost estimate)

Source: the owner's DPD Polska discount cards (`store/kutatas/dpd-arak/dpd_1..6.pdf`
in the fleet workspace; dpd_1 = DPD Pickup Export, dpd_5 = DPD Pickup Import,
the others are signed copies of the same two cards for KICKS BY DAVID s.r.o.).
Valid from 2026-04-01, EUR, **excluding VAT**, invoiced in PLN at the NBP
average rate of the shipping day.

| Card | Destination | <1 kg | 1-3 kg | 3-6 kg | 6-10 kg | 10-20 kg |
|---|---|---|---|---|---|---|
| Pickup Export (PL -> country) | Slovakia (SK) | 2.52 | 2.98 | 3.41 | 4.03 | 6.12 |
| Pickup Export | Hungary (HU) | 2.24 | 2.72 | 3.10 | 3.72 | 6.12 |
| Pickup Import (country -> PL, e.g. returns) | Slovakia | 2.80 | 3.41 | 4.62 | 5.60 | 7.03 |
| Pickup Import | Hungary | 2.52 | 3.10 | 4.29 | 5.25 | 6.66 |

Extra fees on the Export card: COD service 7.30 EUR per COD parcel; security
fee ("opłata bezpieczeństwa") 0.45 EUR per parcel; non-standard parcel /
over technical limits 45 EUR; no zone surcharge for SK/HU. A **fuel
surcharge** is added to every parcel per the monthly table on dpd.com.pl -
not in the card, so it is a setting left empty (shown as missing). DPD may
also add energy/road/seasonal fees (not modelled).

How the dashboard uses it (`settings`, group `profit_costs`, editable
without a deploy; empty = not provided, never treated as 0):

- `shipping.sk.parcel_eur` = 2.98 (1-3 kg tier: a boxed pair of sneakers;
  tier choice is an assumption), `shipping.sk.security_fee_eur` = 0.45,
  `shipping.sk.cod_fee_eur` = 7.30, `shipping.sk.fuel_surcharge_pct` = empty.
- `shipping.sk.home_parcel_eur` = 2.98 **provisional**: SK orders also use
  "DPD HÁZHOZSZÁLLITÁS" (home delivery), whose DPD Classic Export price is
  not among the PDFs.
- HU ships with Packeta: `shipping.hu.*` are empty until the owner provides
  the Packeta prices.
