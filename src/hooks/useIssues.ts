import { useEffect, useState } from "react";
import { getAllIssues, getFeed } from "../api/issues";
import { Issue } from "../types/issue";
import { mockIssues } from "../mocks/issues";

/**
 * 이슈 목록 훅.
 * refreshKey가 바뀔 때마다 재fetch (로그인 후 재로드 지원).
 * BE 서버가 응답하면 실제 데이터 사용, 실패하면 mock 데이터 폴백.
 */
export function useIssues(refreshKey: number = 0) {
  const [issues, setIssues] = useState<Issue[]>(mockIssues);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoading(true);

    const load = async () => {
      try {
        const data = token
          ? await getFeed(20).catch(() => getAllIssues())
          : await getAllIssues();

        if (data.length > 0) {
          setIssues(data);
          setUsingMock(false);
        } else {
          setUsingMock(true);
        }
      } catch {
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [refreshKey]);

  return { issues, loading, usingMock };
}
