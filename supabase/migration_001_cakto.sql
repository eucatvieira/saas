-- Migration: renomeia colunas Stripe para nomes genéricos de provedor de pagamento
-- Rodar no Supabase SQL Editor

alter table public.clinics rename column stripe_customer_id to payment_customer_id;
alter table public.clinics rename column stripe_subscription_id to payment_subscription_id;
