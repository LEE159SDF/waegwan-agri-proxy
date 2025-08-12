// /api/agri/weather.mjs
export default async function handler(req, res) {
  try {
    const KEY = process.env.DATA_GO_KEY;
    if (!KEY) return res.status(500).send('Missing DATA_GO_KEY');

    const { date = '', spotCd = '', pageNo = '1', pageSize = '20', spotNm = '', debug = '0' } = req.query ?? {};
    if (!date || !spotCd) return res.status(400).send('Required: date(YYYY-MM-DD), spotCd');

    // V3 먼저 시도 → 실패 시 구버전 재시도
    const bases = [
      'https://apis.data.go.kr/1390802/AgriWeather/WeatherObsrInfo/V3/GnrlWeather/getWeatherTimeList',
      'https://apis.data.go.kr/1390802/AgriWeather/WeatherObsrInfo/GnrlWeather/getWeatherTimeList'
    ];

    let lastTxt = '', lastStatus = 500;
    for (const base of bases) {
      const u = new URL(base);
      u.searchParams.set('serviceKey', KEY);
      u.searchParams.set('Page_No', String(pageNo));
      u.searchParams.set('Page_Size', String(pageSize));
      u.searchParams.set('date_Time', String(date));       // YYYY-MM-DD
      u.searchParams.set('obsr_Spot_Cd', String(spotCd));  // 예: 477802A001
      if (spotNm) u.searchParams.set('obsr_Spot_Nm', String(spotNm));

      if (debug === '1') {
        const redacted = u.toString().replace(KEY, '***'); // 키 가림
        return res.status(200).setHeader('Content-Type', 'text/plain; charset=utf-8').send(redacted);
      }

      const r = await fetch(u.toString(), { headers: { 'Accept': 'application/xml' } });
      const txt = await r.text();
      if (r.ok && txt.trim()) {
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        return res.status(r.status).send(txt);
      }
      lastTxt = txt; lastStatus = r.status;
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(lastStatus || 502).send(`Upstream failed.\n${lastTxt.slice(0, 1000)}`);
  } catch (e) {
    return res.status(500).send(`proxy error: ${e?.message || e}`);
  }
}
