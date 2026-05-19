// Build-time key embedding.
// Reads MODEL_KEY (64 hex chars) from the environment, parses it to
// 32 raw bytes, and emits a Rust file at OUT_DIR with the parsed
// constant. Including the parsed bytes (not the hex literal) makes
// the key invisible to a simple `grep` over the .wasm binary — the
// attacker has to recognise the scattered byte sequence in .rodata.

use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    println!("cargo:rerun-if-env-changed=MODEL_KEY");

    let hex = env::var("MODEL_KEY").expect("MODEL_KEY env var is required");
    if hex.len() != 64 {
        panic!("MODEL_KEY must be exactly 64 hex chars (got {})", hex.len());
    }
    let mut bytes = [0u8; 32];
    for i in 0..32 {
        bytes[i] = u8::from_str_radix(&hex[i * 2..i * 2 + 2], 16)
            .expect("MODEL_KEY contains non-hex characters");
    }

    let body = format!(
        "pub const KEY_BYTES: [u8; 32] = [{}];\n",
        bytes
            .iter()
            .map(|b| format!("0x{:02x}", b))
            .collect::<Vec<_>>()
            .join(", "),
    );

    let out_dir: PathBuf = env::var("OUT_DIR").unwrap().into();
    fs::write(out_dir.join("key_bytes.rs"), body).unwrap();
}
