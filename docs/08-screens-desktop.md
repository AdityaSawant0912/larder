# Desktop screens

Same five destinations and data model as mobile (`07-screens-mobile.md`),
but each screen gets the layout that fits a wider, cursor-driven surface
rather than a forced reflow of the mobile layout.

## Navigation

Persistent left sidebar with the same five destinations — not tabs. The
mode toggle (Track / Clear-Out / Restock) moves out of the content area
into a top bar alongside search, since it's a control worth always having
visible at this width.

## Home

Same nested item-card concept as mobile — no structural change — laid out
as a responsive grid (3 columns at typical widths, 2 when narrower)
instead of a single stacked column.

## Restock mode — diverges from mobile deliberately

Mobile swaps to a full-screen staging queue; desktop has room to do
better: two-pane layout, search/add on the left (same flow as Home), a
**persistent staging queue rail on the right** that fills as items are
added. Nothing is hidden behind a screen swap — the queue stays visible
while still adding. "Add N to pantry" pins to the bottom of the rail.

## Clear-Out mode

Grid stays as-is with checkboxes on form rows, plus a "select all in view"
affordance (only worth the space at this width). The commit bar becomes a
floating bottom-right panel rather than a full-width bar.

## Grocery List

Two-pane — store rail on the left (Any / Aldi / Walmart / …), item list
for the selected store on the right. Same Checklist/Review toggle as
mobile; store switching is a persistent click instead of a re-filter.

## Use-soon

A dense sortable **table** (item, qty/unit, location, days-left) rather
than cards — the one screen where a table genuinely beats cards, since
the point is fast horizontal scanning across everything at once. "Use up"
as a row-level icon action.

## Settings / Catalog

Master-detail — searchable catalog list on the left, selected item's
editable defaults and thresholds on the right. Store management is a
section within this screen, not a separate destination.

## Modals

Add-Item and Convert render as centered dialogs, not bottom sheets (a
mobile-specific affordance). Convert's multiple output rows can lay out
side-by-side instead of stacked.
