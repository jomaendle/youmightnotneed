import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="font-semibold text-2xl">Not found</h1>
      <p className="text-muted">
        That page does not exist. The rule may have been renamed.
      </p>
      <Link href="/rules">Browse the catalog</Link>
    </div>
  );
}
