// /api/agri/weather.mjs
export default async function handler(req, res) {
  try {
    // ① 키 읽기 (둘 중 하나만 넣어도 됨)
    // - DATA_GO_KEY      : Decoding 키(슬래시/== 포함된 원본)
    // - DATA_GO_KEY_ENC  : Encoding 키(%2F, %3D%3D 형태)
    const KEY_DEC = process.env.DATA_GO_KEY || '';
    const KEY_ENC = process.env.DATA_GO_KEY_ENC || '';

    if (!KEY_DEC && !KEY_ENC) return res.status(500).send('Missing DATA_GO_KEY or DATA_GO_KEY_ENC');

    // ② 파라미터
    const { date = '', spotCd = '', pageNo = '1', pageSize = '20', spotNm = '', debug = '0' } = req.query ?? {};
    if (!date || !spotCd) return res.status(400).send('Required: date(YYYY-MM-DD), spotCd');

    // ③ 정확한 엔드포인트(V3)
    const base = 'https://apis.data.go.kr/1390802/AgriWeather/WeatherObsrInfo/V3/GnrlWeather/getWeatherTimeList';

    // ④ 쿼리스트링 직접 구성 (키는 이중 인코딩 방지)
    const qs = new URLSearchParams();
    qs.set('serviceKey', KEY_ENC || encodeURIComponent(KEY_DEC)); // 이미 인코딩된 키가 있으면 그대로 사용
    qs.set('Page_No', String(pageNo));
    qs.set('Page_Size', String(pageSize));
    qs.set('date_Time', String(date));        // YYYY-MM-DD
    qs.set('obsr_Spot_Cd', String(spotCd));
    if (spotNm) qs.set('obsr_Spot_Nm', String(spotNm));

    const finalUrl = `${base}?${qs.toString()}`;

    // ⑤ debug=1 이면 최종 URL만 보여줌(키는 ***로 마스킹)
    if (debug === '1') {
      const masked = finalUrl.replace(KEY_ENC || encodeURIComponent(KEY_DEC), '***');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(masked);
    }

    // ⑥ 호출
    const r = await fetch(finalUrl, { headers: { 'Accept': 'application/xml' } });
    const txt = await r.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(r.status).send(txt);
  } catch (e) {
    return res.status(500).send(`proxy error: ${e?.message || e}`);
  }
}
