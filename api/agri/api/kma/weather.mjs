// /api/kma/weather.mjs
export default async function handler(req, res) {
  try {
    // KMA 키 (둘 중 하나만 넣어도 됩니다)
    const KEY_DEC = process.env.KMA_KEY || "";        // Decoding 키: ...==
    const KEY_ENC = process.env.KMA_KEY_ENC || "";    // Encoding 키: %2F...%3D%3D
    const serviceKeyRaw = KEY_DEC || (KEY_ENC ? decodeURIComponent(KEY_ENC) : "");
    if (!serviceKeyRaw) return res.status(500).send("Missing KMA_KEY (or KMA_KEY_ENC)");

    // 어떤 API를 호출할지 선택: ncst(초단기실황) | ufcst(초단기예보) | vfcst(단기예보)
    const { op = "ncst", base_date = "", base_time = "", nx = "", ny = "",
            numOfRows = "60", pageNo = "1", dataType = "XML", debug = "0" } = req.query ?? {};

    if (!base_date || !base_time || !nx || !ny) {
      return res.status(400).send("Required: base_date(YYYYMMDD), base_time(HHmm), nx, ny");
    }

    // KMA 단기예보 엔드포인트 (http 권장)
    const endpoints = {
      ncst:  "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst",
      ufcst: "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst",
      vfcst: "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst",
    };
    const base = endpoints[op] || endpoints.ncst;

    const qs = new URLSearchParams();
    qs.set("serviceKey", serviceKeyRaw); // 한 번만 인코딩되도록 raw 값 사용
    qs.set("numOfRows", String(numOfRows));
    qs.set("pageNo", String(pageNo));
    qs.set("dataType", String(dataType));
    qs.set("base_date", String(base_date));
    qs.set("base_time", String(base_time));
    qs.set("nx", String(nx));
    qs.set("ny", String(ny));

    const url = `${base}?${qs.toString()}`;

    if (debug === "1") {
      const masked = url.replace(encodeURIComponent(serviceKeyRaw), "***");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).send(masked);
    }

    const r = await fetch(url, { headers: { Accept: dataType === "JSON" ? "application/json" : "application/xml" }});
    const body = await r.text();
    res.setHeader("Content-Type", (dataType === "JSON" ? "application/json" : "application/xml") + "; charset=utf-8");
    return res.status(r.status).send(body);
  } catch (e) {
    return res.status(500).send(`proxy error: ${e?.message || e}`);
  }
}
