extern crate napi;
#[macro_use]
extern crate napi_derive;

use parcel_js_swc_core::{Config, transform as coreTransform};

use napi::{CallContext, JsObject, JsUnknown, Result};

#[js_function(1)]
fn transform(ctx: CallContext) -> Result<JsUnknown> {
  let opts = ctx.get::<JsObject>(0)?;
  let config: Config = ctx.env.from_js_value(opts)?;

  let result = coreTransform(config)?;
  ctx.env.to_js_value(&result)
}


#[module_exports]
fn init(mut exports: JsObject) -> Result<()> {
  exports.create_named_method("transform", transform)?;

  Ok(())
}
