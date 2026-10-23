import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ADMIN_PAGE_SIZE, parseAdminPage, selectAdminPage } from '../utils/admin';
import useAdminResource from './useAdminResource';

const EMPTY_PAGE = { items: [], hasNext: false };

export default function useAdminList(loadPage) {
  const [params, setParams] = useSearchParams();
  const page = parseAdminPage(params.get('page'));
  const setPage = useCallback((nextPage) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (nextPage > 1) next.set('page', String(nextPage));
      else next.delete('page');
      return next;
    });
  }, [setParams]);
  const load = useCallback(async (signal) => {
    const data = await loadPage({ offset: (page - 1) * ADMIN_PAGE_SIZE, limit: ADMIN_PAGE_SIZE + 1 }, signal);
    if (!Array.isArray(data?.items)) throw new Error('Không thể đọc danh sách. Vui lòng thử lại.');
    if (!signal.aborted && !data.items.length && page > 1) setPage(1);
    return selectAdminPage(data.items);
  }, [loadPage, page, setPage]);
  const { data, ...resource } = useAdminResource(load);
  return { ...resource, ...(data || EMPTY_PAGE), page, setPage };
}
