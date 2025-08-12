// /api/agri/weather.mjs
export default async function handler(req, res) {
  try {
    const KEY = process.env.DATA_GO_KEY;
    if (!KEY) return res.status(500).send('Missing DATA_GO_KEY');

    // 쿼리 받기 (우리 쪽 간편 이름 → 공공데이터 파라미터로 매핑)
    const {
      date,                // yyyy-mm-dd (필수)
      spotCd,              // obsr_Spot_Code (선택)
      spotNm,              // obsr_Spot_Nm (선택, 한글 가능)
      pageNo = '1',
      pageSize = '20'
    } = req.query || {};

    if (!date) return res.status(400).send('Required: date (YYYY-MM-DD)');

    // 반드시 http 사용! (이 API는 https 미지원)
    const base = 'http://apis.data.go.kr/1390802/AgriWeather/WeatherObsrInfo/GnrlWeather';
    const u = new URL(`${base}/getWeatherTimeList`);

    // 필수/옵션 파라미터 채우기 (URLSearchParams가 알아서 인코딩해줌)
    u.searchParams.set('serviceKey', KEY);      // Decoding 키 사용 권장
    u.searchParams.set('Page_No', String(pageNo));
    u.searchParams.set('Page_Size', String(pageSize));
    u.searchParams.set('date_Time', String(date));
    if (spotCd) u.searchParams.set('obsr_Spot_Code', String(spotCd));
    if (spotNm) u.searchParams.set('obsr_Spot_Nm', String(spotNm));

    const r = await fetch(u.toString(), { headers: { 'Accept': 'application/xml' } });
    const xml = await r.text();

    // 그대로 프록시 반환
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(r.status).send(xml);
  } catch (e) {
    return res.status(500).send(`proxy error: ${e.message || e}`);
  }
}
