CREATE DATABASE test;
USE test;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(50) NOT NULL
);

DELIMITER //
CREATE PROCEDURE insert_users()
BEGIN
  DECLARE i INT DEFAULT 1;
  WHILE (i <= 1000) DO
    INSERT INTO users (name, email, password) VALUES (CONCAT('User', i), CONCAT('user', i, '@example.com'), MD5(RAND()));
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

CALL insert_users();
