CREATE TABLE resources(
	id INTEGER NOT NULL PRIMARY KEY,
	file_item_id INTEGER NOT NULL,
	source_id INTEGER NOT NULL,
	key TEXT NOT NULL,
	identifier TEXT NOT NULL,
	signature TEXT NOT NULL,
	comment TEXT NOT NULL,
	line_number INTEGER NOT NULL,
	column_position INTEGER NOT NULL
);

CREATE TABLE file_items(
	file_item_id INTEGER NOT NULL PRIMARY KEY,
	source_id INTEGER NOT NULL,
	full_path TEXT,
	name TEXT NOT NULL COLLATE NOCASE,
	last_modified DATETIME NOT NULL,
	is_parsed INTEGER NOT NULL,
	is_new INTEGER NOT NULL
);

CREATE TABLE sources(
	source_id INTEGER NOT NULL PRIMARY KEY,
	directory TEXT NOT NULL
);
