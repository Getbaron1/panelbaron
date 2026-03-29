const DEFAULT_BASE_URL = 'https://api.getbaron.com.br/v1'

function buildCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
}

exports.handler = async (event) => {
  const corsHeaders = buildCorsHeaders()

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    }
  }

  try {
    const path = event.queryStringParameters?.path

    if (!path) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Missing "path" query param' }),
      }
    }

    const baseUrl = (process.env.ADMIN_API_BASE_URL || process.env.VITE_ADMIN_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
    const token = process.env.ADMIN_API_TOKEN || process.env.VITE_ADMIN_API_TOKEN || ''
    const apiKey = process.env.ADMIN_API_KEY || process.env.VITE_ADMIN_API_KEY || ''

    const upstreamUrl = new URL(`${baseUrl}${path}`)

    Object.entries(event.queryStringParameters || {}).forEach(([key, value]) => {
      if (!value || key === 'path') return
      upstreamUrl.searchParams.set(key, value)
    })

    const headers = {
      Accept: 'application/json',
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    if (apiKey) {
      headers['x-api-key'] = apiKey
    }

    const response = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers,
    })

    const body = await response.text()

    return {
      statusCode: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
      body,
    }
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Proxy error',
      }),
    }
  }
}
