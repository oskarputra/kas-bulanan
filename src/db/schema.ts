import {
  pgTable, uuid, text, bigint, integer, boolean, date, timestamp, index, uniqueIndex, serial,
} from 'drizzle-orm/pg-core'

const money = (name: string) => bigint(name, { mode: 'number' })

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  salary: money('salary').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('users_email_idx').on(t.email)])

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(), // sha256 dari token cookie
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (t) => [index('sessions_user_idx').on(t.userId)])

// Aturan tanggal gajian. Baris terbaru dengan effective_from <= tanggal yang berlaku.
export const paydayRules = pgTable('payday_rules', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  day: integer('day').notNull(),
  weekendShift: boolean('weekend_shift').notNull().default(true),
  effectiveFrom: date('effective_from').notNull(),
}, (t) => [index('payday_rules_user_idx').on(t.userId, t.effectiveFrom)])

export const pots = pgTable('pots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  target: money('target').notNull().default(0),
  deadline: date('deadline'),
  color: text('color').notNull().default('green'),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('pots_user_idx').on(t.userId)])

export const recurringItems = pgTable('recurring_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  amount: money('amount').notNull(),
  category: text('category').notNull(),
  variable: boolean('variable').notNull().default(false),
  dueDay: integer('due_day'),
  kind: text('kind', { enum: ['bill', 'saving'] }).notNull().default('bill'),
  potId: uuid('pot_id').references(() => pots.id, { onDelete: 'set null' }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('recurring_items_user_idx').on(t.userId)])

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['out', 'in'] }).notNull(),
  amount: money('amount').notNull(),
  category: text('category').notNull(),
  note: text('note').notNull().default(''),
  date: date('date').notNull(),
  source: text('source', { enum: ['manual', 'recurring', 'saving'] }).notNull().default('manual'),
  recurringItemId: uuid('recurring_item_id').references(() => recurringItems.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('transactions_user_date_idx').on(t.userId, t.date)])

export const savingTxs = pgTable('saving_txs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  potId: uuid('pot_id').notNull().references(() => pots.id, { onDelete: 'cascade' }),
  amount: money('amount').notNull(), // positif = setor, negatif = tarik
  date: date('date').notNull(),
  note: text('note').notNull().default(''),
  countedAsExpense: boolean('counted_as_expense').notNull().default(false),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('saving_txs_user_idx').on(t.userId, t.date), index('saving_txs_pot_idx').on(t.potId)])

export const recurringPayments = pgTable('recurring_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => recurringItems.id, { onDelete: 'cascade' }),
  periodStart: date('period_start').notNull(),
  amount: money('amount').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'cascade' }),
  savingTxId: uuid('saving_tx_id').references(() => savingTxs.id, { onDelete: 'cascade' }),
}, (t) => [uniqueIndex('recurring_payments_item_period_idx').on(t.itemId, t.periodStart)])

export type User = typeof users.$inferSelect
export type PaydayRule = typeof paydayRules.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type RecurringItem = typeof recurringItems.$inferSelect
export type Pot = typeof pots.$inferSelect
export type SavingTx = typeof savingTxs.$inferSelect
