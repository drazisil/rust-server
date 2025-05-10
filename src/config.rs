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
