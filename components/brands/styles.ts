// Class strings shared by the brand components (server and client).

/** 32px square row-action buttons (VendorProductList mockup): View green, Edit iris, Delete red. */
export const rowActionClass = {
  base: "flex size-8 flex-none cursor-pointer items-center justify-center rounded-sm border transition-colors focus-visible:ring-3 focus-visible:ring-iris-100 focus-visible:outline-none",
  view: "border-success-bg bg-success-soft text-success-solid hover:bg-success-bg hover:text-success-solid",
  edit: "border-iris-100 bg-iris-50 text-iris-500 hover:bg-iris-100 hover:text-iris-500",
  delete: "border-error-line bg-error-bg text-error-solid hover:border-error-solid/30",
};

/** Primary (iris) and secondary (outlined) buttons of the list/detail pages and dialogs. */
export const buttonClass = {
  primary:
    "inline-flex cursor-pointer items-center justify-center gap-2 bg-iris-500 leading-none whitespace-nowrap text-white transition-colors hover:bg-iris-600 hover:text-white focus-visible:ring-3 focus-visible:ring-iris-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-iris-300",
  secondary:
    "inline-flex cursor-pointer items-center justify-center gap-2 border border-line bg-surface leading-none font-semibold whitespace-nowrap text-ink-soft transition-colors hover:bg-field hover:text-ink-soft focus-visible:ring-3 focus-visible:ring-iris-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
  danger:
    "inline-flex cursor-pointer items-center justify-center gap-2 bg-error-solid leading-none whitespace-nowrap text-white transition-colors hover:bg-error focus-visible:ring-3 focus-visible:ring-error-line focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
};
