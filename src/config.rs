// This file is part of the Oxide project, licensed under GPL-3.0-or-later.
// See the COPYING.md file in the project root for more information.

use serde::Deserialize;
use std::fs;

#[derive(Deserialize)]
pub struct Config {
    pub tcp_ports: Vec<u16>,
}

impl Config {
    pub fn from_file(path: &str) -> Self {
        let config_data = fs::read_to_string(path).expect("Unable to read config file");
        serde_json::from_str(&config_data).expect("Invalid config format")
    }
}
