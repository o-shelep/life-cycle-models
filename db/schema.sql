CREATE DATABASE IF NOT EXISTS books_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE books_manager;

DROP TABLE IF EXISTS club_reviews;
DROP TABLE IF EXISTS book_votes;
DROP TABLE IF EXISTS club_books;
DROP TABLE IF EXISTS club_polls;
DROP TABLE IF EXISTS club_members;
DROP TABLE IF EXISTS clubs;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS authors;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE genres (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    UNIQUE KEY uq_genre_per_user (user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE authors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) DEFAULT NULL,
    genre VARCHAR(100) DEFAULT NULL,
    status ENUM('onPlan', 'inProgress', 'read') NOT NULL DEFAULT 'onPlan',
    rating TINYINT UNSIGNED DEFAULT NULL,
    cover_image VARCHAR(255) DEFAULT NULL,
    note TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reading clubs (same tables as db/migrations/001_clubs.sql, which is for upgrading an existing database)

CREATE TABLE clubs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    rules TEXT DEFAULT NULL,
    type ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_club_name (name),
    CONSTRAINT chk_club_name CHECK (CHAR_LENGTH(name) BETWEEN 3 AND 100),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- status: active = full member, invited = owner/moderator sent an invitation,
--         requested = user asked to join a closed club
CREATE TABLE club_members (
    club_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'moderator', 'member') NOT NULL DEFAULT 'member',
    status ENUM('active', 'invited', 'requested') NOT NULL DEFAULT 'active',
    invited_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (club_id, user_id),
    KEY idx_member_user (user_id),
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- Polls for choosing the next book of the month (FR-4)
CREATE TABLE club_polls (
    id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL DEFAULT NULL,
    KEY idx_poll_club (club_id, status),
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- Shared reading list (FR-3). Title/author/genre are copied so the entry stays
-- valid when the member who added it deletes the book from their own diary.
-- status: proposed = candidate in a poll, planned = chosen for reading,
--         inProgress = being read now, done = discussed
CREATE TABLE club_books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL,
    source_book_id INT DEFAULT NULL,
    poll_id INT DEFAULT NULL,
    added_by INT DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) DEFAULT NULL,
    genre VARCHAR(100) DEFAULT NULL,
    status ENUM('proposed', 'planned', 'inProgress', 'done') NOT NULL DEFAULT 'inProgress',
    deadline DATE DEFAULT NULL,
    discussion_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_club_books_filter (club_id, status, deadline),
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (source_book_id) REFERENCES books(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (poll_id) REFERENCES club_polls(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (added_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- One vote per member per poll (US3)
CREATE TABLE book_votes (
    poll_id INT NOT NULL,
    user_id INT NOT NULL,
    club_book_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (poll_id, user_id),
    KEY idx_vote_book (club_book_id),
    FOREIGN KEY (poll_id) REFERENCES club_polls(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (club_book_id) REFERENCES club_books(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Reviews and ratings shared inside a club (FR-5)
CREATE TABLE club_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL,
    club_book_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT UNSIGNED DEFAULT NULL,
    review TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_review_per_user (club_book_id, user_id),
    KEY idx_review_club (club_id),
    CONSTRAINT chk_review_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (club_book_id) REFERENCES club_books(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);
