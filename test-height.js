const maxCanvasHeight = 32000;
const scrollHeight = 25000;
let pixelRatio = 2.0;
if (scrollHeight * pixelRatio > maxCanvasHeight) {
  pixelRatio = Math.max(1.0, Math.floor((maxCanvasHeight / scrollHeight) * 10) / 10);
}
console.log(pixelRatio);
