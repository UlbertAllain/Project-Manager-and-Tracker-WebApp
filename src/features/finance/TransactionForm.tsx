import { PlusCircle } from "lucide-react";
import { addTransactionAction } from "@/features/finance/actions";
import type { Project } from "@/features/projects/types";

export function TransactionForm({ projects }: { projects: Project[] }) {
  return (
    <section className="panel-card overflow-hidden">
      <div className="section-header"><div><span className="eyebrow">PENCATATAN TRANSAKSI</span><h3>Catat Transaksi Proyek</h3><p>Data keuangan hanya dapat dilihat dan dikelola oleh Pemilik / Admin.</p></div></div>
      <form action={addTransactionAction} className="finance-form">
        <div><label className="label">Proyek</label><select className="input" name="projectId" required><option value="">Pilih proyek</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
        <div><label className="label">Jenis</label><select className="input" name="type"><option value="INCOME">Pemasukan</option><option value="EXPENSE">Pengeluaran</option></select></div>
        <div><label className="label">Nominal</label><input className="input" min="1" name="amount" type="number" placeholder="0" required /></div>
        <div><label className="label">Tanggal</label><input className="input" name="date" type="date" required /></div>
        <div><label className="label">Keterangan</label><input className="input" name="description" placeholder="Contoh: uang muka, domain, hosting, atau biaya operasional" required /></div>
        <div className="flex items-end"><button className="btn btn-primary w-full" type="submit"><PlusCircle className="size-4" /> Tambah Transaksi</button></div>
      </form>
    </section>
  );
}
