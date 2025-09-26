// Cloudflare Worker (JavaScript) — เก็บรหัสไว้เป็น Secrets ของ Worker
// คำสั่งตั้งค่าใน Cloudflare:
// wrangler secret put FLASH_USER
// wrangler secret put FLASH_PASS
// แล้วดีพลอยด้วย wrangler
//
// Endpoint:
//   GET /receiver?phone=0812345678

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (url.pathname === '/receiver' && request.method === 'GET') {
      const phone = url.searchParams.get('phone')
      if (!phone) return json({ error: 'missing phone' }, 400)

      // Credentials from Worker secrets
      const user = env.FLASH_USER
      const pass = env.FLASH_PASS
      if (!user || !pass) return json({ error: 'worker is not configured' }, 500)

      try {
        const headers = baseHeaders()
        // 1) login
        const loginRes = await fetch('https://api.flashexpress.com/api/courier/v2/auth/new_device_login', {
          method: 'POST',
          headers: { ...headers, 'content-type': 'application/json' },
          body: JSON.stringify({
            clientid: crypto.randomUUID(),
            clientsd: crypto.randomUUID(),
            login: user,
            password: pass,
            os: 'FH',
            version: '1.15.34',
          }),
        })
        const loginJson = await loginRes.json()
        if (loginJson?.code !== 1) {
          return json({ error: 'Flash login failed', detail: loginJson }, 400)
        }
        const d = loginJson.data || {}
        const sid = d.sessionid
        const sna = d.store_id
        const lat = String(d.store_lat)
        const lng = String(d.store_lng)

        // 2) get receiver
        const addrUrl = `https://api.flashexpress.com/api/courier/v2/address/${encodeURIComponent(phone)}?isSrcAddress=false`
        const getHeaders = {
          ...headers,
          'X-FLE-SESSION-ID': sid,
          'X-Store-ID': sna,
          'X-Device-Lat': lat,
          'X-Device-Lng': lng,
        }
        const addrRes = await fetch(addrUrl, { headers: getHeaders })
        const addrJson = await addrRes.json()
        if (addrJson?.code !== 1) {
          return json({ error: 'Flash API error', detail: addrJson }, 400)
        }
        const rows = Array.isArray(addrJson.data) ? addrJson.data : []
        // sort by name
        rows.sort((a,b) => String(a?.name||'').localeCompare(String(b?.name||'')))

        return json({ ok: true, results: rows })
      } catch (e) {
        return json({ error: String(e) }, 500)
      }
    }
    return new Response('Not found', { status: 404 })
  }
}

function baseHeaders() {
  const guid = crypto.randomUUID()
  return {
    'Accept-Language': 'th',
    'Accept': 'application/json',
    'X-DEVICE-ID': guid,
    'X-FLE-EQUIPMENT-TYPE': 'fh',
    'User-Agent': `appName/FlashHome appVersion/1.15.34 wv/22631.3810 language/th-TH r/1920x1080 64b/True time_zone/07%3a00%3a00 u/User m/admin nv/4.8 fn/Microsoft+Windows+10+Home di/${crypto.randomUUID()} ud/${crypto.randomUUID()}`
  }
}

function json(obj, status=200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  })
}
