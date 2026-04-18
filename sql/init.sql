CREATE DATABASE IF NOT EXISTS kwvc DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE kwvc;

CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'notice',
    is_top TINYINT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    id_card VARCHAR(20),
    school VARCHAR(200),
    college VARCHAR(200),
    company_school VARCHAR(200),
    occupation VARCHAR(100),
    project_name VARCHAR(255) NOT NULL,
    project_category VARCHAR(100),
    project_desc TEXT,
    team_members TEXT,
    experience TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS works (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    registration_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    demo_url VARCHAR(500),
    video_url VARCHAR(500),
    tech_platform VARCHAR(200),
    status ENUM('submitted', 'reviewing', 'approved', 'rejected') DEFAULT 'submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (registration_id) REFERENCES registrations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO users (username, password, real_name, role) VALUES ('admin', 'admin123', '系统管理员', 'admin');

INSERT IGNORE INTO site_configs (config_key, config_value) VALUES
('hero_title', '凯文杯·首届'),
('hero_subtitle2', '首届VibeCoding零代码项目创作大赛'),
('hero_slogan', 'Code is cheap! Show your idea!'),
('prize_pool', '100000'),
('track_count', '5'),
('judge_count', '30'),
('expected_participants', '1000'),
('categories', '智慧教育
数字商业
智慧城市
健康医疗
开放创新'),
('timeline_registration', '2026.04.01 - 06.30'),
('timeline_development', '2026.05.01 - 07.31'),
('timeline_preliminary', '2026.08.01 - 08.15'),
('timeline_final', '2026.08.25'),
('timeline_award', '2026.08.30');
