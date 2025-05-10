-- Migration to create the shards table
CREATE TABLE shards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    login_server_ip VARCHAR(255) NOT NULL,
    login_server_port INT NOT NULL,
    lobby_server_ip VARCHAR(255) NOT NULL,
    lobby_server_port INT NOT NULL,
    mcots_server_ip VARCHAR(255),
    server_group_name VARCHAR(255),
    population INT,
    max_personas_per_user INT,
    diagnostic_server_host VARCHAR(255),
    diagnostic_server_port INT,
    status JSONB
);
