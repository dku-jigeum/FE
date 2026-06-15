import { useEffect, useState } from "react";
import { getTrending } from "../api/issues";
import { Issue } from "../types/issue";

/**
 * 홈 트렌딩 이슈 훅.
 * BE 조회수·참여수 기반 트렌딩 Top-N을 로드. 실패하면 빈 배열(호출 측에서 폴백).
 * refreshKey가 바뀌면 재fetch (로그인 후 재로드 지원).
 */
export function useTrending(limit = 9, refreshKey: number = 0) {
  const [trending, setTrending] = useState<Issue[]>([]);

  useEffect(() => {
    getTrending(limit)
      .then(setTrending)
      .catch(() => setTrending([]));
  }, [limit, refreshKey]);

  return trending;
}
