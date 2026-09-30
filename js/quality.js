/* ============================================================
   quality.js: photo quality check + compression
   Never blocks the user; only reports technical issues.
   ============================================================ */

const Quality = (function () {

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = dataUrl;
    });
  }

  /* Shrink a data URL to a max side and re-encode as JPEG */
  async function compress(dataUrl, maxSide, quality) {
    maxSide = maxSide || 900;
    quality = quality || 0.8;
    const img = await loadImage(dataUrl);
    let { width: w, height: h } = img;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    w = Math.round(w * scale);
    h = Math.round(h * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  }

  /* Analyse brightness, blur and glare on a 256px grayscale copy */
  async function check(dataUrl) {
    const img = await loadImage(dataUrl);

    const S = 256;
    const scale = Math.min(1, S / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    const data = ctx.getImageData(0, 0, w, h).data;
    const gray = new Float32Array(w * h);

    let sum = 0, glare = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const v = 0.299 * r + 0.587 * g + 0.114 * b;
      gray[p] = v;
      sum += v;
      if (r >= 250 && g >= 250 && b >= 250) glare++;
    }

    const mean = sum / (w * h);
    const glareShare = glare / (w * h);

    /* 4-neighbour Laplacian variance (measure of sharpness) */
    let lapSum = 0, lapSumSq = 0, lapCount = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const lap = (4 * gray[i]) - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
        lapSum += lap;
        lapSumSq += lap * lap;
        lapCount++;
      }
    }
    const lapMean = lapCount ? lapSum / lapCount : 0;
    const variance = lapCount ? (lapSumSq / lapCount) - (lapMean * lapMean) : 0;

    const issues = [];
    if (mean < 55) issues.push('q_too_dark');
    if (mean > 215) issues.push('q_overexposed');
    if (variance < 40) issues.push('q_blurry');
    if (glareShare > 0.06) issues.push('q_glare');

    return {
      ok: issues.length === 0,
      issues,
      brightness: Math.round(mean),
      sharpness: Math.round(variance),
      glare: Math.round(glareShare * 1000) / 10
    };
  }

  return { check, compress };
})();