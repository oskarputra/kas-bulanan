-- Supabase membuka tabel di schema public lewat Data API (PostgREST).
-- Aplikasi ini tidak memakai Data API; ia konek langsung sebagai role postgres
-- yang melewati RLS. Menyalakan RLS tanpa policy menutup akses anon/authenticated,
-- termasuk ke tabel users (hash kata sandi) dan sessions.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payday_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recurring_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "saving_txs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recurring_payments" ENABLE ROW LEVEL SECURITY;
