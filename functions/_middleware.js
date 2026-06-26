const R  = '\x1b[0m';   // reset
const B  = '\x1b[1m';   // bold
const D  = '\x1b[2m';   // dim
const BL = '\x1b[94m';  // bright blue (steel)
const W  = '\x1b[97m';  // bright white

const HR = `${D}${'─'.repeat(54)}${R}`;

const ASCII_CARD = `
  ${B}${W}siddhesh badnapurkar${R}
  ${HR}
  ${D}cs senior${R}    @ univ. of pune
  ${D}sde intern${R}   @ data axle india

  ${BL}interests:${R} hft systems · low-latency c++ · quant dev

  ${BL}github  →${R}  https://github.com/51ddhesh
  ${BL}blog    →${R}  https://51ddhesh.pages.dev/blog
  ${HR}
`;

export async function onRequest({ request, next }) {
  const ua = request.headers.get('User-Agent') || '';

  if (ua.toLowerCase().includes('curl')) {
    return new Response(ASCII_CARD, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return next();
}
