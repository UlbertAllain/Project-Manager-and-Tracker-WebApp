import { ArrowDownLeft, ArrowUpRight, Landmark, WalletCards } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { deleteTransactionAction } from "@/features/finance/actions";
import { TransactionForm } from "@/features/finance/TransactionForm";
import { requireAdmin } from "@/lib/auth/guards";
import { formatCurrency, formatDate } from "@/lib/format";
import { listProjects } from "@/lib/repositories/projects";
import { listTransactions } from "@/lib/repositories/transactions";

export default async function FinancePage() {
  await requireAdmin();
  const [projects, transactions] = await Promise.all([listProjects(), listTransactions()]);
  const income = transactions.filter((item) => item.type === "INCOME").reduce((sum, item) => sum + item.amount, 0);
  const expense = transactions.filter((item) => item.type === "EXPENSE").reduce((sum, item) => sum + item.amount, 0);
  return (
    <section className="space-y-5">
      <header className="page-heading"><div><span className="eyebrow"><Landmark className="size-3.5" /> RINGKASAN KEUANGAN</span><h2>Keuangan</h2><p>Pantau pemasukan, pengeluaran, dan saldo proyek yang menjadi tanggung jawab perusahaan.</p></div></header>
      <div className="dashboard-metrics team-metrics">
        <Metric icon={<ArrowDownLeft />} label="Pemasukan" value={formatCurrency(income)} />
        <Metric icon={<ArrowUpRight />} label="Pengeluaran" value={formatCurrency(expense)} danger />
        <Metric icon={<WalletCards />} label="Saldo tercatat" value={formatCurrency(income - expense)} />
      </div>
      <TransactionForm projects={projects} />
      <section className="panel-card overflow-hidden">
        <div className="section-header"><div><span className="eyebrow">TRANSAKSI PROYEK</span><h3>Riwayat transaksi</h3><p>Setiap transaksi akan memperbarui ringkasan keuangan proyek secara otomatis.</p></div><span className="count-pill">{transactions.length}</span></div>
        <div className="table-wrap"><table><thead><tr><th>Tanggal</th><th>Proyek</th><th>Jenis</th><th>Keterangan</th><th>Nominal</th><th /></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id}><td>{formatDate(transaction.date)}</td><td className="font-semibold text-[var(--text-main)]">{transaction.projectName}</td><td><span className={`health-badge ${transaction.type === "INCOME" ? "success" : "danger"}`}>{transaction.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}</span></td><td>{transaction.description}</td><td>{formatCurrency(transaction.amount)}</td><td><form action={deleteTransactionAction}><input type="hidden" name="transactionId" value={transaction.id} /><ConfirmSubmitButton className="task-delete" message="Hapus transaksi ini? Ringkasan keuangan proyek akan disesuaikan secara otomatis.">Hapus</ConfirmSubmitButton></form></td></tr>)}{transactions.length === 0 ? <tr><td colSpan={6}><div className="empty-state">Belum ada transaksi. Tambahkan pemasukan atau pengeluaran pertama untuk mulai mencatat keuangan proyek.</div></td></tr> : null}</tbody></table></div>
      </section>
    </section>
  );
}

function Metric({ icon, label, value, danger = false }: { icon: React.ReactNode; label: string; value: string; danger?: boolean }) {
  return <div className={`dashboard-metric ${danger ? "danger" : ""}`}><div className="dashboard-metric-icon">{icon}</div><div><p>{label}</p><strong>{value}</strong><span>Seluruh proyek</span></div></div>;
}
