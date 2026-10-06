# Schema and status writeup

## Schema

One MongoDB collection, `invoices`:

_id, invoiceNumber, vendorName, amountCents, currency, issueDate, dueDate, description, status, reviewReason, duplicateOfId, decidedAt, history[], createdAt, updatedAt

`history` is embedded in the invoice (fromStatus, toStatus, note, createdAt). It is always read together with the invoice and stays small, and it lets a status change and its history entry be written in one atomic update.

Amounts are stored as integer cents to avoid rounding errors. A `$jsonSchema` validator enforces required fields, types and the status values in the database, and Zod validates requests in the API.

Indexes: `{ status, createdAt }` for the tabs, `{ vendorName, invoiceNumber }` for duplicate checks, and `{ duplicateOfId }` to find an invoice's duplicates.

## Statuses

- PROCESSING: new, waiting for a decision
- NEEDS_REVIEW: needs a closer look, e.g. a possible duplicate
- APPROVED / REJECTED: final

Allowed changes: PROCESSING → NEEDS_REVIEW, APPROVED or REJECTED; NEEDS_REVIEW → APPROVED or REJECTED. Anything else returns 409.

Rejecting needs a reason, and the UI also asks for one when flagging. The update only applies if the invoice still has the status the server read, so if two reviewers act at the same time the second one gets 409.

## Duplicates

An invoice with the same vendor and invoice number as an existing one starts in NEEDS_REVIEW and points to the original through `duplicateOfId`. The detail page shows both side by side and warns before approving.
