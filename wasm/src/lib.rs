// Minice protected-asset decryptor.
//
// Container format (Minice CryptEnvelope v1):
//
//   offset  size  field
//   ------  ----  ----------------------------------
//        0     4  magic            = b"MNCE"
//        4     1  version          = 1
//        5     1  flags            = 0  (reserved)
//        6     2  reserved         = 0
//        8     4  plaintext_len    (big-endian u32)
//       12    12  nonce            (random per-asset)
//       24     N  ciphertext + 16-byte AES-256-GCM tag
//
// The key is embedded at COMPILE TIME via the MODEL_KEY env var (64 hex
// chars). Living in the .wasm binary is materially harder to extract
// than a JS string — that's the whole point of this layer.
//
// The plaintext returned here is NOT a drop-in .vrm even when the
// attacker has the key: it's a Minice CryptEnvelope and they still
// need to know how to strip the 24-byte header. The inner bytes ARE a
// valid GLB (since the source is a .vrm), but the wire format never
// is. That's "layer 2 / custom container" from the plan.

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use wasm_bindgen::prelude::*;

const MAGIC: &[u8; 4] = b"MNCE";
const VERSION: u8 = 1;
const HEADER_LEN: usize = 12;
const NONCE_LEN: usize = 12;
const TAG_LEN: usize = 16;

// build.rs parses MODEL_KEY at compile time and emits the 32 raw bytes
// into OUT_DIR/key_bytes.rs. We include the constant here so the
// resulting .wasm holds the key as scattered .rodata bytes — not a
// human-readable hex string that a `grep` over the binary would find.
include!(concat!(env!("OUT_DIR"), "/key_bytes.rs"));

#[wasm_bindgen]
pub fn decrypt(blob: &[u8]) -> Result<Vec<u8>, JsValue> {
    if blob.len() < HEADER_LEN + NONCE_LEN + TAG_LEN {
        return Err(JsValue::from_str("blob too small"));
    }
    if &blob[0..4] != MAGIC {
        return Err(JsValue::from_str("bad magic"));
    }
    if blob[4] != VERSION {
        return Err(JsValue::from_str("unsupported version"));
    }

    let plaintext_len = u32::from_be_bytes([blob[8], blob[9], blob[10], blob[11]]) as usize;

    let nonce_bytes = &blob[HEADER_LEN..HEADER_LEN + NONCE_LEN];
    let ciphertext = &blob[HEADER_LEN + NONCE_LEN..];

    let key = Key::<Aes256Gcm>::from_slice(&KEY_BYTES);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plain = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| JsValue::from_str("decrypt failed"))?;

    if plain.len() != plaintext_len {
        return Err(JsValue::from_str("plaintext length mismatch"));
    }
    Ok(plain)
}
