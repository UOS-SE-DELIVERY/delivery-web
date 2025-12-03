import {
  AlertCircle,
  CheckCircle,
  Edit2,
  Package,
  RefreshCw,
  Save,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  getInventoryItemsAPI,
  InventoryItem,
  patchInventoryItemAPI,
} from '@/api/staff/inventory.api';

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editActive, setEditActive] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchInventory = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getInventoryItemsAPI();
      setItems(data.items);
    } catch (err) {
      setError('재고 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setEditQty(item.qty);
    setEditActive(item.active);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsSaving(false);
  };

  const handleSave = async () => {
    if (!editingItem) return;

    setIsSaving(true);
    try {
      await patchInventoryItemAPI(editingItem.code, {
        qty: editQty,
        active: editActive,
      });
      // Update local state optimistically or refetch
      await fetchInventory(true);
      handleCloseModal();
    } catch (err) {
      alert('재고 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !isRefreshing && items.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-primary h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-muted-foreground">재고 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="bg-destructive/10 flex max-w-md flex-col items-center gap-4 rounded-lg p-8 text-center">
          <AlertCircle className="text-destructive h-12 w-12" />
          <h3 className="text-destructive text-lg font-semibold">오류 발생</h3>
          <p className="text-destructive/80">{error}</p>
          <button
            onClick={() => fetchInventory()}
            className="bg-destructive/20 text-destructive hover:bg-destructive/30 rounded-md px-4 py-2 text-sm font-medium"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold">
            <Package className="text-primary h-8 w-8" />
            재고 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            현재 보유 중인 재고 현황을 확인하고 수정합니다.
          </p>
        </div>
        <button
          onClick={() => fetchInventory(true)}
          disabled={isRefreshing}
          className="border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground focus:ring-ring flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          {isRefreshing ? '새로고침 중...' : '새로고침'}
        </button>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="text-muted-foreground w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">
                  상품명
                </th>
                <th scope="col" className="px-6 py-4 font-semibold">
                  상품 코드
                </th>
                <th scope="col" className="px-6 py-4 text-center font-semibold">
                  수량
                </th>
                <th scope="col" className="px-6 py-4 text-center font-semibold">
                  상태
                </th>
                <th scope="col" className="px-6 py-4 text-center font-semibold">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {items.map(item => (
                <tr key={item.code} className="hover:bg-muted/50">
                  <td className="text-foreground px-6 py-4 font-medium">
                    {item.name}
                  </td>
                  <td className="text-muted-foreground px-6 py-4 font-mono text-xs">
                    {item.code}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.qty > 10
                          ? 'bg-blue-100 text-blue-800'
                          : item.qty > 5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.qty}개
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        활성
                      </span>
                    ) : (
                      <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
                        <XCircle className="h-3 w-3" />
                        비활성
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1 rounded-md p-2"
                      title="수정"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-muted-foreground px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="text-muted-foreground/50 h-8 w-8" />
                      <p>등록된 재고가 없습니다.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-card ring-border w-full max-w-md rounded-xl shadow-xl ring-1">
            <div className="border-border flex items-center justify-between border-b p-4">
              <h3 className="text-card-foreground text-lg font-semibold">
                재고 수정
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <label className="text-foreground block text-sm font-medium">
                  상품명
                </label>
                <div className="border-border bg-muted/50 text-foreground mt-1 rounded-md border px-3 py-2">
                  {editingItem.name}
                </div>
              </div>

              <div>
                <label className="text-foreground block text-sm font-medium">
                  상품 코드
                </label>
                <div className="border-border bg-muted/50 text-muted-foreground mt-1 rounded-md border px-3 py-2 font-mono text-sm">
                  {editingItem.code}
                </div>
              </div>

              <div>
                <label
                  htmlFor="qty"
                  className="text-foreground block text-sm font-medium"
                >
                  수량
                </label>
                <input
                  type="number"
                  id="qty"
                  value={editQty}
                  onChange={e => setEditQty(parseInt(e.target.value) || 0)}
                  className="border-input bg-background text-foreground focus:border-ring focus:ring-ring mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-1 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={editActive}
                  onChange={e => setEditActive(e.target.checked)}
                  className="border-input text-primary focus:ring-ring h-4 w-4 rounded"
                />
                <label
                  htmlFor="active"
                  className="text-foreground text-sm font-medium"
                >
                  활성 상태
                </label>
              </div>
            </div>

            <div className="border-border bg-muted/20 flex items-center justify-end gap-3 rounded-b-xl border-t p-4">
              <button
                onClick={handleCloseModal}
                className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg border px-4 py-2 text-sm font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="border-primary-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    저장
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
