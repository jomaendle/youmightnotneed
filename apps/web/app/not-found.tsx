import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-page-title">Not found</h1>
      <p className="max-w-[58ch] text-fg-muted">
        That page does not exist. A rule may have been renamed.
      </p>
      <p>
        <Link href="/rules">Browse the catalog</Link>
      </p>
    </div>
  );
}
