import { TransactionsTable } from "@/components/transactions-table";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6 md:p-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Transactions Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor payments, download invoices, and retry failed transactions.
        </p>
      </header>

      <TransactionsTable />
    </main>
  );
}
