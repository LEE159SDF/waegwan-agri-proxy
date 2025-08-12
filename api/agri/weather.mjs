// /api/agri/weather.mjs
export default async function handler(req, res) {
  try {
    const KEY = process.env.DATA_GO_KEY;
    if (!KEY) return res.status(500).send('Missing DATA_GO_KEY');

    const { date = '', spotCd = '', pageNo = '1', pageSize = '20', spotNm = '' } = req.query ?? {};
    if (!date || !spotCd) return res.status(400).send('Required: date(YYYY-MM-DD), spotCd');

    const bases = [
      'https://apis.data.go.kr/1390802/AgriWeather/WeatherObsrInfo/V3/GnrlWeather/getWeatherTimeList', // V3 먼저
      'https://apis.data.go.kr/1390802/AgriWeather/WeatherObsrInfo/GnrlWeather/getWeatherTimeList'     // 구버전
    ];

    let lastTxt = '', lastStatus = 500;
    for (const base of bases) {
      const u = new URL(base);
      u.searchParams.set('serviceKey', KEY);
      u.searchParams.set('Page_No', String(pageNo));
      u.searchParams.set('Page_Size', String(pageSize));
      u.searchParams.set('date_Time', String(date));   // YYYY-MM-DD
      u.searchParams.set('obsr_Spot_Cd', String(spotCd));
      if (spotNm) u.searchParams.set('obsr_Spot_Nm', String(spotNm));

      const r = await fetch(u.toString());
      const txt = await r.text();
      if (r.ok && txt.trim()) {
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        return res.status(r.status).send(txt);
      }
      lastTxt = txt; lastStatus = r.status;
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(lastStatus || 502).send(`Upstream failed. Last response snippet:\n${lastTxt.slice(0, 800)}`);
  } catch (e) {
    return res.status(500).send(`proxy error: ${e?.message || e}`);
  }
}
