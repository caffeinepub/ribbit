# Specification

## Summary
**Goal:** Fix Ribbits so image attachments upload, persist, and display correctly everywhere Ribbits are shown, including the intended blurred backdrop rendering.

**Planned changes:**
- Update ribbit creation flow so the selected image is uploaded from the frontend, persisted with the ribbit in the backend, and returned by ribbit query APIs as an optional image blob field.
- Update ribbit rendering to consistently show attached images with the same blurred background/backdrop behavior (especially for non-4:3 aspect ratios) on the Lily page thread/list views and anywhere else ribbits with images appear (e.g., profile ribbits/comments list if present).
- Add a safe backend state upgrade to introduce the new optional ribbit image field without breaking existing stored ribbits (pre-existing ribbits load with no image).

**User-visible outcome:** Users can attach an image when posting a ribbit on the Lily page, see it render with the blurred backdrop, and after refreshing the page the image still loads because it was persisted; ribbits without images continue to work as before.
