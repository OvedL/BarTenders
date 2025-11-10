DROP TABLE REVIEW;
DROP TABLE EVENT_INFO;
DROP TABLE VENUE;
DROP TABLE BARTENDER;
DROP TABLE BARTENDER_IMG;
DROP TABLE USER_INFO;
DROP TABLE CREDENTIALS;

CREATE TABLE IF NOT EXISTS CREDENTIALS (
  credentialID INTEGER PRIMARY KEY,
  title VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS USER_INFO (
  userID        INTEGER PRIMARY KEY AUTO_INCREMENT,
  firstName     VARCHAR(50) NOT NULL,
  lastName      VARCHAR(50) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  phoneNumber   VARCHAR(15),              -- phone as VARCHAR(255) is safest
  city          VARCHAR(30),
  state         VARCHAR(30),
  zipcode       VARCHAR(15),
  createdAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  credentialID  INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (credentialID) REFERENCES CREDENTIALS(credentialID) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS BARTENDER_IMG (
  imgID     INTEGER PRIMARY KEY AUTO_INCREMENT,
  imgName   VARCHAR(255) NOT NULL,
  path      VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS BARTENDER (
  bartenderID INTEGER PRIMARY KEY AUTO_INCREMENT,
  yearsOfService INTEGER,
  bio VARCHAR(255),
  city VARCHAR(30),
  state VARCHAR(30),
  priorEvents VARCHAR(255),
  imgID INTEGER,
  userID INTEGER,
  FOREIGN KEY (imgID) REFERENCES BARTENDER_IMG(imgID) ON DELETE SET NULL,
  FOREIGN KEY (userID) REFERENCES USER_INFO(userID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS VENUE (
  venueID     INTEGER PRIMARY KEY AUTO_INCREMENT,
  venueName   VARCHAR(255) NOT NULL,
  street      VARCHAR(255),
  city        VARCHAR(30),
  state       VARCHAR(30),
  zipcode     VARCHAR(15)
);

CREATE TABLE IF NOT EXISTS EVENT_INFO (
  eventID       INTEGER PRIMARY KEY AUTO_INCREMENT,
  eventDate     DATE NOT NULL,         -- or store only start/end as timestamps
  startTime     DATETIME NOT NULL,
  endTime       DATETIME NOT NULL,
  eventTier     VARCHAR(50),                  -- free VARCHAR(255) or use a lookup later
  drinkPackage  VARCHAR(50),                  -- free VARCHAR(255) or use a lookup later
  userID        INTEGER NOT NULL,      -- client/organizer
  bartenderID   INTEGER,               -- assigned bartender (optional at first)
  venueID       INTEGER,               -- optional
  createdAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userID)      REFERENCES USER_INFO(userID)        ON DELETE CASCADE,
  FOREIGN KEY (bartenderID) REFERENCES BARTENDER(bartenderID) ON DELETE SET NULL,
  FOREIGN KEY (venueID)     REFERENCES VENUE(venueID)      ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS REVIEW (
  reviewID   INTEGER PRIMARY KEY AUTO_INCREMENT,
  eventID    INTEGER NOT NULL,
  ratings ENUM('1','2','3','4','5') NOT NULL,
  comments   VARCHAR(255),
  reviewerID INTEGER,                  -- optional: which USER wrote it
  bartenderID INTEGER,                 -- optional: who is being reviewed
  createdAt  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (eventID)     REFERENCES EVENT_INFO(eventID)           ON DELETE CASCADE,
  FOREIGN KEY (reviewerID)  REFERENCES USER_INFO(userID)             ON DELETE SET NULL,
  FOREIGN KEY (bartenderID) REFERENCES BARTENDER(bartenderID)   ON DELETE SET NULL,
  UNIQUE (eventID, reviewerID)   -- prevents duplicate review by same user for event
);



INSERT INTO CREDENTIALS (credentialID, title) VALUES (1, 'client');
INSERT INTO CREDENTIALS (credentialID, title) VALUES (2, 'bartender');
INSERT INTO CREDENTIALS (credentialID, title) VALUES (3, 'manager');
INSERT INTO CREDENTIALS (credentialID, title) VALUES (4, 'admin');