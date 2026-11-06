-- Agendo Pro marketplace schema for MySQL 8.0+.
-- Select your target database before running this file.
-- All monetary columns use the local currency configured by the platform.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(24) NOT NULL,
  email VARCHAR(254) NULL,
  password_hash VARCHAR(255) NULL,
  role ENUM('customer', 'barber', 'admin') NOT NULL DEFAULT 'customer',
  status ENUM('active', 'inactive', 'blocked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_phone (phone),
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_role_status (role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS barbershops (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT NULL,
  address VARCHAR(255) NOT NULL,
  neighborhood VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL DEFAULT 'Ciudad de México',
  phone VARCHAR(24) NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'America/Mexico_City',
  status ENUM('draft', 'active', 'paused') NOT NULL DEFAULT 'draft',
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_barbershops_slug (slug),
  KEY ix_barbershops_city_status (city, status),
  CONSTRAINT fk_barbershops_owner FOREIGN KEY (owner_user_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_barbershops_rating CHECK (rating >= 0 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS services (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  barbershop_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  category ENUM('haircut', 'beard', 'combo', 'product') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_services_shop_active_category (barbershop_id, is_active, category),
  CONSTRAINT fk_services_barbershop FOREIGN KEY (barbershop_id)
    REFERENCES barbershops (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_services_price CHECK (price >= 0),
  CONSTRAINT chk_services_duration CHECK (duration_minutes > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS offers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  barbershop_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NULL,
  title VARCHAR(160) NOT NULL,
  description VARCHAR(500) NULL,
  discount_type ENUM('fixed', 'percent') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  inventory_limit INT UNSIGNED NULL,
  status ENUM('draft', 'active', 'paused', 'expired') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_offers_shop_status_window (barbershop_id, status, starts_at, ends_at),
  CONSTRAINT fk_offers_barbershop FOREIGN KEY (barbershop_id)
    REFERENCES barbershops (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_offers_service FOREIGN KEY (service_id)
    REFERENCES services (id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_offers_discount CHECK (
    discount_value >= 0 AND
    (discount_type <> 'percent' OR discount_value <= 100)
  ),
  CONSTRAINT chk_offers_window CHECK (ends_at > starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  barbershop_id BIGINT UNSIGNED NOT NULL,
  plan_name VARCHAR(120) NOT NULL DEFAULT 'Pase VIP mensual',
  price DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status ENUM('pending', 'active', 'past_due', 'cancelled', 'expired') NOT NULL DEFAULT 'pending',
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  billing_provider VARCHAR(60) NULL,
  provider_subscription_id VARCHAR(191) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_subscriptions_user_status (user_id, status),
  KEY ix_subscriptions_shop_status (barbershop_id, status),
  UNIQUE KEY uq_subscriptions_provider_id (billing_provider, provider_subscription_id),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_subscriptions_barbershop FOREIGN KEY (barbershop_id)
    REFERENCES barbershops (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_subscriptions_price CHECK (price >= 0),
  CONSTRAINT chk_subscriptions_dates CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- One reusable public code belongs to one customer in one shop.
CREATE TABLE IF NOT EXISTS referral_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  barbershop_id BIGINT UNSIGNED NOT NULL,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(80) NOT NULL,
  status ENUM('active', 'paused', 'revoked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_referral_codes_shop_code (barbershop_id, code),
  KEY ix_referral_codes_owner (owner_user_id, barbershop_id, status),
  CONSTRAINT fk_referral_codes_barbershop FOREIGN KEY (barbershop_id)
    REFERENCES barbershops (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_referral_codes_owner FOREIGN KEY (owner_user_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS appointments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  barbershop_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NOT NULL,
  offer_id BIGINT UNSIGNED NULL,
  referral_code_id BIGINT UNSIGNED NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  notes VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_appointments_shop_start_status (barbershop_id, starts_at, status),
  KEY ix_appointments_user_created (user_id, created_at),
  KEY ix_appointments_referral (referral_code_id, status),
  CONSTRAINT fk_appointments_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_appointments_barbershop FOREIGN KEY (barbershop_id)
    REFERENCES barbershops (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_appointments_service FOREIGN KEY (service_id)
    REFERENCES services (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_appointments_offer FOREIGN KEY (offer_id)
    REFERENCES offers (id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_appointments_referral_code FOREIGN KEY (referral_code_id)
    REFERENCES referral_codes (id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_appointments_time CHECK (ends_at > starts_at),
  CONSTRAINT chk_appointments_amounts CHECK (
    subtotal >= 0 AND discount_amount >= 0 AND total_amount >= 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A conversion is created in the same transaction as its appointment.
-- Credit the referrer exactly once after the booking reaches the configured status.
CREATE TABLE IF NOT EXISTS referrals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  referral_code_id BIGINT UNSIGNED NOT NULL,
  barbershop_id BIGINT UNSIGNED NOT NULL,
  referrer_user_id BIGINT UNSIGNED NOT NULL,
  referred_user_id BIGINT UNSIGNED NOT NULL,
  appointment_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending', 'completed', 'rewarded', 'rejected') NOT NULL DEFAULT 'pending',
  reward_type ENUM('free_haircut', 'discount', 'credit') NOT NULL DEFAULT 'free_haircut',
  reward_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  reward_credited_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_referrals_appointment (appointment_id),
  UNIQUE KEY uq_referrals_shop_customer (barbershop_id, referred_user_id),
  KEY ix_referrals_owner_status_date (referrer_user_id, status, created_at),
  KEY ix_referrals_code_status (referral_code_id, status),
  CONSTRAINT fk_referrals_code FOREIGN KEY (referral_code_id)
    REFERENCES referral_codes (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_referrals_barbershop FOREIGN KEY (barbershop_id)
    REFERENCES barbershops (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_referrals_referrer FOREIGN KEY (referrer_user_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_referrals_referred FOREIGN KEY (referred_user_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_referrals_appointment FOREIGN KEY (appointment_id)
    REFERENCES appointments (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_referrals_distinct_users CHECK (referrer_user_id <> referred_user_id),
  CONSTRAINT chk_referrals_reward CHECK (reward_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
