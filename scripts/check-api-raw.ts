/* eslint-disable @typescript-eslint/no-explicit-any */
async function main() {
  const res = await fetch('http://openapi.foodsafetykorea.go.kr/api/4ab11cac0b164b9ab055/COOKRCP01/json/1/1000');
  const data = await res.json();
  const all = data.COOKRCP01?.row || [];
  
  for (const name of ['호박잎다슬기된장국', '양배추두부찜과 양파케첩소스', '유자삼치구이', '배추토란국']) {
    const r = all.find((r: any) => r.RCP_NM === name);
    if (r) {
      console.log('=== ' + r.RCP_NM + ' ===');
      console.log('RAW: [' + r.RCP_PARTS_DTLS + ']');
      console.log('');
    }
  }
}
main();
