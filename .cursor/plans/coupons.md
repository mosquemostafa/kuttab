export const couponTypeEnum = pgEnum("coupon_type", [
"gift", // 100% free subscription — used now
"discount", // percentage or fixed off — used when gateway lands
]);

export const couponDiscountTypeEnum = pgEnum(
"coupon_discount_type",
["percentage", "fixed"],
);

export const coupon = pgTable(
"coupons",
{
id: text("id").primaryKey().$defaultFn(() => createId()),
code: text("code").notNull(),
description: text("description"),
type: couponTypeEnum("type").notNull(),

    // Discount fields (type = 'discount' only)
    discountType: couponDiscountTypeEnum("discount_type"),
    discountValue: integer("discount_value"),
    currency: invoiceCurrencyEnum("currency").$type<InvoiceCurrencyEnum>(),

    // Gift fields (type = 'gift' only)
    giftPlan: subscriptionPlanEnum("gift_plan").$type<SubscriptionPlanEnum>(),
    giftDuration: integer("gift_duration"), // in days

    // Usage
    usageLimit: integer("usage_limit"),        // null = unlimited
    usageCount: integer("usage_count").notNull().default(0),
    perUserLimit: integer("per_user_limit").notNull().default(1),

    // Validity
    startsAt: timestamp("starts_at"),
    expiresAt: timestamp("expires_at"),

    // Discount applicability (type = 'discount' only)
    applicablePlans: jsonb("applicable_plans").$type<SubscriptionPlanEnum[]>(),

    isActive: boolean("is_active").notNull().default(true),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

},
(table) => [
uniqueIndex("coupons_code_unique").on(table.code),
index("coupons_type_is_active_idx").on(table.type, table.isActive),
index("coupons_expires_at_idx").on(table.expiresAt),

    check(
      "coupons_gift_fields_required_ck",
      sql`${table.type} != 'gift' OR (
        ${table.giftPlan} IS NOT NULL AND ${table.giftDuration} IS NOT NULL
      )`,
    ),
    check(
      "coupons_discount_fields_required_ck",
      sql`${table.type} != 'discount' OR (
        ${table.discountType} IS NOT NULL AND ${table.discountValue} IS NOT NULL
      )`,
    ),
    check(
      "coupons_currency_required_for_fixed_ck",
      sql`${table.discountType} IS NULL OR
          ${table.discountType} != 'fixed' OR
          ${table.currency} IS NOT NULL`,
    ),
    check(
      "coupons_percentage_max_ck",
      sql`${table.discountType} IS NULL OR
          ${table.discountType} != 'percentage' OR
          ${table.discountValue} <= 100`,
    ),
    check(
      "coupons_discount_value_positive_ck",
      sql`${table.discountValue} IS NULL OR ${table.discountValue} > 0`,
    ),
    check(
      "coupons_gift_duration_positive_ck",
      sql`${table.giftDuration} IS NULL OR ${table.giftDuration} > 0`,
    ),
    check(
      "coupons_usage_count_non_negative_ck",
      sql`${table.usageCount} >= 0`,
    ),
    check(
      "coupons_per_user_limit_positive_ck",
      sql`${table.perUserLimit} > 0`,
    ),
    check(
      "coupons_dates_order_ck",
      sql`${table.startsAt} IS NULL OR
          ${table.expiresAt} IS NULL OR
          ${table.startsAt} < ${table.expiresAt}`,
    ),

],
);

export const couponUsage = pgTable(
"coupon_usages",
{
id: text("id").primaryKey().$defaultFn(() => createId()),
couponId: text("coupon_id")
.notNull()
.references(() => coupon.id, { onDelete: "cascade" }),
userId: text("user_id")
.notNull()
.references(() => user.id, { onDelete: "cascade" }),
// Only set for discount coupons when gateway is implemented
invoiceId: text("invoice_id")
.references(() => invoice.id, { onDelete: "set null" }),
usedAt: timestamp("used_at").defaultNow().notNull(),
},
(table) => [
index("coupon_usages_coupon_id_idx").on(table.couponId),
index("coupon_usages_user_id_idx").on(table.userId),
index("coupon_usages_coupon_user_idx").on(table.couponId, table.userId),
],
);
