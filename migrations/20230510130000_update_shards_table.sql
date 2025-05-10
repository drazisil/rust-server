-- Migration to update the shards table to make all fields non-nullable
ALTER TABLE shards
ALTER COLUMN description SET NOT NULL,
ALTER COLUMN mcots_server_ip SET NOT NULL,
ALTER COLUMN server_group_name SET NOT NULL,
ALTER COLUMN population SET NOT NULL,
ALTER COLUMN max_personas_per_user SET NOT NULL,
ALTER COLUMN diagnostic_server_host SET NOT NULL,
ALTER COLUMN diagnostic_server_port SET NOT NULL,
ALTER COLUMN status SET NOT NULL;
