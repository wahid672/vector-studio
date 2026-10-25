// UI presets configure VTracer; they do not emulate Vector Magic's engine.
export const imagePresets = {
  logo: {quality:'high',detail:'medium',simplify:1.2,speckle:2,mode:'spline'},
  sharp: {quality:'high',detail:'high',simplify:.35,speckle:1,mode:'polygon'},
  photo: {quality:'medium',detail:'medium',simplify:1.2,speckle:4,mode:'spline'},
  bw: {quality:'medium',detail:'medium',simplify:1.2,speckle:4,mode:'spline'}
};
export const detailPresets = {high:.35,medium:1.2,low:2.4};
export const qualityPresets = {high:2,medium:4,low:12};

export function parsePalette(text) {
  const colors = [...new Set(text.trim().split(/[\s,;]+/).filter(Boolean).map(color=>color.toUpperCase()))];
  if (!colors.length || colors.length>256 || colors.some(color=>!/^#[0-9A-F]{6}$/.test(color))) {
    throw Error('Isi palet dengan 1–256 warna HEX #RRGGBB, dipisahkan koma atau baris baru.');
  }
  return colors;
}

export function buildOptions(settings) {
  const bw=settings.preset==='bw';
  const options={
    clustering:bw?'bw':'color-cluster',
    hierarchical:'cutout',mode:settings.mode,
    // Keep full channel precision. Unlimited leaves maxColors and palette unset.
    colorPrecision:8,
    layerDifference:{high:4,medium:16,low:32}[settings.quality],
    cornerThreshold:settings.preset==='photo'?100:settings.preset==='sharp'?40:60,
    simplify:Number(settings.simplify),filterSpeckle:Number(settings.speckle),
    pathPrecision:settings.detail==='high'?3:2,optimize:1
  };
  if(bw) options.binaryThreshold=Number(settings.threshold);
  else if(settings.colorMode==='limited') {
    const count=Number(settings.colors);
    if(!Number.isInteger(count)||count<2||count>256) throw Error('Batas warna harus antara 2 dan 256.');
    options.maxColors=count;
  } else if(settings.colorMode==='custom') options.palette=parsePalette(settings.palette);
  return options;
}
