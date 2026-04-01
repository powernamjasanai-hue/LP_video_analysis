import { NextRequest, NextResponse } from 'next/server'

export const config = { matcher: ['/dashboard/:path*'] }

export function middleware(req: NextRequest) {
  const auth = req.headers.get('authorization')

  if (auth) {
    const [scheme, encoded] = auth.split(' ')
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded)
      const [user, pass] = decoded.split(':')
      if (
        user === process.env.DASHBOARD_USER &&
        pass === process.env.DASHBOARD_PASS
      ) {
        return NextResponse.next()
      }
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Dashboard"' },
  })
}
