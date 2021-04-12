use wasm_bindgen::prelude::*;

use serde_wasm_bindgen;
use parcel_js_swc_core::{transform as coreTransform, Config};

#[wasm_bindgen]
pub fn transform(val: JsValue) ->  Result<JsValue, JsValue> {
  let config: Config = serde_wasm_bindgen::from_value(val)?;

  let result = coreTransform(config).unwrap();
  serde_wasm_bindgen::to_value(&result).map_err(|err| err.into())
}
