// UI presets configure VTracer; they do not emulate Vector Magic's engine.
export const imagePresets = {
  logo: {quality:'high',detail:'medium',simplify:.5,speckle:1,mode:'spline',cleanup:'balanced',layering:'cutout'},
  sharp: {quality:'high',detail:'high',simplify:.2,speckle:0,mode:'polygon',cleanup:'off',layering:'cutout'},
  photo: {quality:'medium',detail:'medium',simplify:.5,speckle:1,mode:'spline',cleanup:'balanced',layering:'cutout'},
  bw: {quality:'medium',detail:'medium',simplify:.5,speckle:1,mode:'spline',cleanup:'balanced',layering:'cutout'}
};
export const detailPresets = {high:.2,medium:.5,low:1};
export const qualityPresets = {high:1,medium:2,low:3};

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
    hierarchical:settings.layering==='stacked'?'stacked':'cutout',mode:settings.mode,
    // Keep segmentation precision independent from cleanup strength. Coarse
    // precision + wide layer differences flattened continuous skin/hair shading.
    colorPrecision:8,
    layerDifference:4,
    cornerThreshold:settings.preset==='photo'?100:settings.preset==='sharp'?40:60,
    simplify:Number(settings.simplify),filterSpeckle:Number(settings.speckle),
    pathPrecision:3,optimize:1
  };
  if(bw) options.binaryThreshold=Number(settings.threshold);
  else if(settings.colorMode==='limited') {
    const count=Number(settings.colors);
    if(!Number.isInteger(count)||count<2||count>256) throw Error('Batas warna harus antara 2 dan 256.');
    options.maxColors=count;
  } else if(settings.colorMode==='custom') options.palette=parsePalette(settings.palette);
  return options;
}
