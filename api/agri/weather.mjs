// /api/agri/weather.mjs
export default async function handler(req, res) {
  try {
    const KEY = process.env.DATA_GO_KEY; // Decoding 키
    if (!KEY) return res.status(500).send('Missing DATA_GO_KEY');

    const { date = '', spotCd = '', pageNo = '1', pageSize = '20', spotNm = '' } = req.query ?? {};
    if (!date || !spotCd) return res.status(400).send('Required: date(YYYY-MM-DD), spotCd');

    const base = 'https://apis.data.go.kr/1390802/AgriWeather/WeatherObsrInfo/GnrlWeather/getWeatherTimeList';
    // 필요시 V3:
    // const base = 'https://apis.data.go.kr/1390802/AgriWeather/WeatherObsrInfo/V3/GnrlWeather/getWeatherTimeList';

    const u = new URL(base);
    u.searchParams.set('serviceKey', KEY);
    u.searchParams.set('Page_No', String(pageNo));
    u.searchParams.set('Page_Size', String(pageSize));
    u.searchParams.set('date_Time', String(date));    // YYYY-MM-DD
    u.searchParams.set('obsr_Spot_Cd', String(spotCd));
    if (spotNm) u.searchParams.set('obsr_Spot_Nm', String(spotNm));

    const r = await fetch(u.toString());
    const xml = await r.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(r.status).send(xml);
  } catch (e) {
    return res.status(500).send(`proxy error: ${e?.message || e}`);
  }
}
