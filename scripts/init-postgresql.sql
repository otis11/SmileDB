CREATE DATABASE test;

\c test;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(50) NOT NULL
);

DO $$
BEGIN
  FOR i IN 1..1000 LOOP
    INSERT INTO users (name, email, password) VALUES (CONCAT('User', i), CONCAT('user', i, '@example.com'), MD5(RANDOM()::TEXT));
  END LOOP;
END $$;
