
// /api/kma/kma.mjs
export default async function handler(req, res) {
  try {
    // 🔑 환경변수: KMA_KEY(Decoding …==) 또는 KMA_KEY_ENC(Encoding %2F…%3D%3D) 중 하나만 필요
    const KEY_DEC = process.env.KMA_KEY || "";
    const KEY_ENC = process.env.KMA_KEY_ENC || "";
    const serviceKeyRaw = KEY_DEC || (KEY_ENC ? decodeURIComponent(KEY_ENC) : "");
    if (!serviceKeyRaw) return res.status(500).send("Missing KMA_KEY (or KMA_KEY_ENC)");

    // 어떤 API 호출? ncst=초단기실황, ufcst=초단기예보, vfcst=단기예보
    const {
      op = "ncst",
      base_date = "",      // YYYYMMDD
      base_time = "",      // HHmm
      nx = "", ny = "",
      numOfRows = "60",
      pageNo = "1",
      dataType = "XML",    // XML | JSON
      debug = "0",
    } = req.query ?? {};

    if (!base_date || !base_time || !nx || !ny) {
      return res.status(400).send("Required: base_date, base_time, nx, ny");
    }

    // ✅ 기상청 단기예보 엔드포인트 (http 사용)
    const endpoints = {
      ncst:  "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst",
      ufcst: "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst",
      vfcst: "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst",
    };
    const base = endpoints[op] || endpoints.ncst;

    const qs = new URLSearchParams();
    qs.set("serviceKey", serviceKeyRaw);      // URLSearchParams가 1회만 인코딩
    qs.set("numOfRows", String(numOfRows));
    qs.set("pageNo", String(pageNo));
    qs.set("dataType", String(dataType));
    qs.set("base_date", String(base_date));
    qs.set("base_time", String(base_time));
    qs.set("nx", String(nx));
    qs.set("ny", String(ny));

    const url = `${base}?${qs.toString()}`;

    // 최종 호출 URL 확인(키 마스킹)
    if (debug === "1") {
      const masked = url
        .replace(serviceKeyRaw, "***")
        .replace(encodeURIComponent(serviceKeyRaw), "***");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).send(masked);
    }

    const accept = dataType === "JSON" ? "application/json" : "application/xml";
    const r = await fetch(url, { headers: { Accept: accept } });
    const body = await r.text();
    res.setHeader("Content-Type", `${accept}; charset=utf-8`);
    return res.status(r.status).send(body);
  } catch (e) {
    return res.status(500).send(`proxy error: ${e?.message || e}`);
  }
}
