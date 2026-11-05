// 테스트용: API_PROXY_TARGET을 주면 /api-proxy/* 를 백엔드로 프록시(CORS 우회). 평소에는 사용하지 않음.
const target = process.env.API_PROXY_TARGET;
export default {
  async rewrites() {
    return target ? [{ source: '/api-proxy/:path*', destination: `${target}/:path*` }] : [];
  },
};
