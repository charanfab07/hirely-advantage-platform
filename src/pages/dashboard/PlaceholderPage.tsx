export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="font-display text-2xl font-semibold tracking-tight">{title}</div>
      <p className="max-w-sm text-[14px] text-muted-foreground">
        Coming next. We're shipping this module shortly — the design language will match the Resume page.
      </p>
    </div>
  );
}
