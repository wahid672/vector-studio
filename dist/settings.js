// UI presets configure VTracer; they do not emulate Vector Magic's engine.
export const imagePresets = {
  logo: {quality:'high',detail:'medium',simplify:.8,speckle:4,mode:'spline',cleanup:'balanced',layering:'stacked'},
  sharp: {quality:'high',detail:'high',simplify:.25,speckle:1,mode:'polygon',cleanup:'off',layering:'stacked'},
  photo: {quality:'medium',detail:'medium',simplify:.8,speckle:6,mode:'spline',cleanup:'balanced',layering:'stacked'},
  bw: {quality:'medium',detail:'medium',simplify:.8,speckle:4,mode:'spline',cleanup:'balanced',layering:'stacked'}
};
export const detailPresets = {high:.25,medium:.8,low:1.6};
export const qualityPresets = {high:4,medium:6,low:12};

export function parsePalette(text) {
  const colors = [...new Set(text.trim().split(/[\s,;]+/).filter(Boolean).map(color=>color.toUpperCase()))];
  if (!colors.length || colors.length>256 || colors.some(color=>!/^#[0-9A-F]{6}$/.test(color))) {
    throw Error('Isi palet dengan 1–256 warna HEX #RRGGBB, dipisahkan koma atau baris baru.');
  }
  return colors;
}

export function buildOptions(settings) {
  const bw=settings.preset==='bw';
  const cleanup=settings.cleanup||'balanced',raw=cleanup==='off';
  const precision={high:7,medium:6,low:5}[settings.detail]||6;
  const options={
    clustering:bw?'bw':'color-cluster',
    hierarchical:settings.layering==='cutout'?'cutout':'stacked',mode:settings.mode,
    // Unlimited leaves the palette uncapped; precision groups insignificant color noise.
    colorPrecision:raw?8:Math.max(4,precision-(cleanup==='strong'?1:0)),
    layerDifference:(raw?{high:4,medium:16,low:32}:cleanup==='strong'?{high:24,medium:32,low:48}:{high:16,medium:24,low:32})[settings.quality],
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
