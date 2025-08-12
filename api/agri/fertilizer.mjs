// /api/agri/fertilizer.mjs
export default async function handler(req, res) {
  try {
    const KEY = process.env.DATA_GO_KEY; // Decoding 키(==로 끝나는 원본)
    if (!KEY) return res.status(500).send('Missing DATA_GO_KEY');

    const { cropCode = '' } = req.query ?? {}; // fstd_Crop_Code (예: 00001=벼)
    if (!cropCode) return res.status(400).send('Required: cropCode');

    const u = new URL('https://apis.data.go.kr/1390802/SoilEnviron/FrtlzrStdUse/getSoilFrtlzrQyList');
    u.searchParams.set('serviceKey', KEY);
    u.searchParams.set('fstd_Crop_Code', String(cropCode));

    const r = await fetch(u.toString());
    const xml = await r.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(r.status).send(xml);
  } catch (e) {
    return res.status(500).send(`proxy error: ${e?.message || e}`);
  }
}
