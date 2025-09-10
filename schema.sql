CREATE TABLE IF NOT EXISTS USER (
  userID        INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName     TEXT NOT NULL,
  lastName      TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phoneNumber   TEXT,              -- phone as TEXT is safest
  city          TEXT,
  state         TEXT,
  zipcode       TEXT,
  bartenderID   INTEGER,           -- nullable: user may or may not be a bartender
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bartenderID) REFERENCES BARTENDER(bartenderID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS BARTENDER_IMG (
  imgID     INTEGER PRIMARY KEY AUTOINCREMENT,
  imgName   TEXT NOT NULL,
  path      TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS BARTENDER (
  bartenderID    INTEGER PRIMARY KEY AUTOINCREMENT,
  yearsOfService INTEGER CHECK (yearsOfService >= 0),
  bio            TEXT,
  city           TEXT,
  state          TEXT,
  priorEvents    INTEGER CHECK (priorEvents >= 0),
  imgID          INTEGER,  -- optional profile image
  createdAt      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (imgID) REFERENCES BARTENDER_IMG(imgID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS VENUE (
  venueID     INTEGER PRIMARY KEY AUTOINCREMENT,
  venueName   TEXT NOT NULL,
  street      TEXT,
  city        TEXT,
  state       TEXT,
  zipcode     TEXT
);

CREATE TABLE IF NOT EXISTS EVENT (
  eventID       INTEGER PRIMARY KEY AUTOINCREMENT,
  eventDate     DATE NOT NULL,         -- or store only start/end as timestamps
  startTime     DATETIME NOT NULL,
  endTime       DATETIME NOT NULL,
  eventTier     TEXT,                  -- free text or use a lookup later
  drinkPackage  TEXT,                  -- free text or use a lookup later
  userID        INTEGER NOT NULL,      -- client/organizer
  bartenderID   INTEGER,               -- assigned bartender (optional at first)
  venueID       INTEGER,               -- optional
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userID)      REFERENCES USER(userID)        ON DELETE CASCADE,
  FOREIGN KEY (bartenderID) REFERENCES BARTENDER(bartenderID) ON DELETE SET NULL,
  FOREIGN KEY (venueID)     REFERENCES VENUE(venueID)      ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS REVIEW (
  reviewID   INTEGER PRIMARY KEY AUTOINCREMENT,
  eventID    INTEGER NOT NULL,
  ratings    INTEGER NOT NULL CHECK (ratings BETWEEN 1 AND 5),
  comments   TEXT,
  reviewerID INTEGER,                  -- optional: which USER wrote it
  bartenderID INTEGER,                 -- optional: who is being reviewed
  createdAt  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (eventID)     REFERENCES EVENT(eventID)           ON DELETE CASCADE,
  FOREIGN KEY (reviewerID)  REFERENCES USER(userID)             ON DELETE SET NULL,
  FOREIGN KEY (bartenderID) REFERENCES BARTENDER(bartenderID)   ON DELETE SET NULL,
  UNIQUE (eventID, reviewerID)   -- prevents duplicate review by same user for event
);
