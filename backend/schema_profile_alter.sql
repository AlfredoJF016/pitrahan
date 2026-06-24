-- ALTER SCHEMA FOR piTrahan PROFILE SETTINGS, RBAC, AND OWASP SECURITY COMPLIANCE
-- Target DBMS: MySQL 8.0+

USE pitrahan;

-- 1. Alter users table to support Profile Settings, KYC Verification, and Anonymization (GDPR)
ALTER TABLE users
  ADD COLUMN avatar_url       TEXT          DEFAULT NULL AFTER password_hash,
  ADD COLUMN no_telepon       VARCHAR(20)   DEFAULT NULL AFTER avatar_url,
  ADD COLUMN kyc_doc_url      TEXT          DEFAULT NULL AFTER no_telepon,
  ADD COLUMN is_kyc_verified  TINYINT(1)    NOT NULL DEFAULT 0 AFTER kyc_doc_url,
  ADD COLUMN is_anonymized    TINYINT(1)    NOT NULL DEFAULT 0 AFTER is_kyc_verified,
  ADD COLUMN is_banned        TINYINT(1)    NOT NULL DEFAULT 0 AFTER is_anonymized,
  ADD COLUMN anonymized_at    DATETIME      DEFAULT NULL AFTER is_banned,
  ADD COLUMN last_seen_at     DATETIME      DEFAULT NULL AFTER anonymized_at;

-- 2. Alter rentals_stores table to store GPS Coordinates for MITRA (Owners)
ALTER TABLE rentals_stores
  ADD COLUMN gps_latitude     DECIMAL(10,8) DEFAULT NULL AFTER no_telepon,
  ADD COLUMN gps_longitude    DECIMAL(11,8) DEFAULT NULL AFTER gps_latitude;

-- 3. Create Table: user_activity_logs for OWASP security audit logging (login, logout, changes)
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    email VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- e.g., 'LOGIN', 'LOGOUT', 'UPDATE_PROFIL', 'UBAH_PASSWORD', 'REVOKE_SESSIONS', 'DELETE_ACCOUNT', 'KYC_UPLOAD'
    details TEXT NOT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    status ENUM('success', 'failed') NOT NULL DEFAULT 'success',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_log_email (email),
    INDEX idx_log_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create Table: active_sessions to manage active login sessions and support "Keluar dari Semua Perangkat" (Force Logout)
CREATE TABLE IF NOT EXISTS active_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_jti VARCHAR(255) NOT NULL UNIQUE, -- JWT ID for session tracking / blacklisting
    user_agent VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (token_jti)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
