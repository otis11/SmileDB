CREATE DATABASE test;
GO

USE test;
GO

CREATE TABLE users (
  id INT PRIMARY KEY IDENTITY(1,1),
  name VARCHAR(50) NOT NULL,
  email VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(50) NOT NULL
);
GO

CREATE PROCEDURE insert_users
AS
BEGIN
  DECLARE @i INT = 1;
  WHILE (@i <= 1000)
  BEGIN
    INSERT INTO users (name, email, password) VALUES (CONCAT('User', @i), CONCAT('user', @i, '@example.com'), HASHBYTES('MD5', CAST(RAND() AS VARBINARY)));
    SET @i = @i + 1;
  END;
END;
GO

EXEC insert_users;
GO
